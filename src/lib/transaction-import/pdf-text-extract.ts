/**
 * Serverless-safe PDF text extraction.
 * Preview/Vercel cannot load @napi-rs/canvas; pdf-parse then throws
 * DOMMatrix and the previous tesseract OCR path hung until a 504.
 */

import { inflateSync, inflateRawSync } from "node:zlib";
import { installPdfJsDomPolyfills } from "./pdf-dom-polyfill";

function decodePdfLiteral(raw: string): string {
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\([0-7]{1,3})/g, (_, oct: string) =>
      String.fromCharCode(parseInt(oct, 8)),
    );
}

function decodePdfHex(hex: string): string {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  if (clean.length >= 4 && clean.length % 4 === 0) {
    const chars: string[] = [];
    for (let i = 0; i < clean.length; i += 4) {
      const code = parseInt(clean.slice(i, i + 4), 16);
      if (code) chars.push(String.fromCharCode(code));
    }
    return chars.join("");
  }
  const bytes: string[] = [];
  const padded = clean.length % 2 === 1 ? `${clean}0` : clean;
  for (let i = 0; i < padded.length; i += 2) {
    bytes.push(String.fromCharCode(parseInt(padded.slice(i, i + 2), 16)));
  }
  return bytes.join("");
}

function extractPdfOperators(content: string): string {
  const glyphs: { x: number; y: number; text: string }[] = [];
  let x = 0;
  let y = 0;
  const opRe =
    /(BT|ET|T\*)|(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(Td|TD)|(?:-?\d+(?:\.\d+)?\s+){4}(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Tm|(\((?:\\.|[^\\)])*\))\s*Tj|(<[^>]{2,}>)(?:\s*Tj)?/g;
  let match: RegExpExecArray | null;
  while ((match = opRe.exec(content))) {
    if (match[1] === "BT") {
      x = 0;
      y = 0;
      continue;
    }
    if (match[1] === "ET") continue;
    if (match[1] === "T*") {
      y -= 12;
      x = 0;
      continue;
    }
    if (match[4] === "Td" || match[4] === "TD") {
      x += Number(match[2]);
      y += Number(match[3]);
      continue;
    }
    if (match[5] !== undefined && match[6] !== undefined) {
      x = Number(match[5]);
      y = Number(match[6]);
      continue;
    }
    if (match[7]) {
      const text = decodePdfLiteral(match[7].slice(1, -1));
      if (text) glyphs.push({ x, y, text });
      continue;
    }
    if (match[8]) {
      const text = decodePdfHex(match[8].slice(1, -1));
      if (text) glyphs.push({ x, y, text });
    }
  }

  if (glyphs.length === 0) {
    const parts: string[] = [];
    const tokenRe = /\((?:\\.|[^\\)])*\)|<[^>]{2,}>/g;
    let tokenMatch: RegExpExecArray | null;
    while ((tokenMatch = tokenRe.exec(content))) {
      const token = tokenMatch[0];
      parts.push(
        token.startsWith("(")
          ? decodePdfLiteral(token.slice(1, -1))
          : decodePdfHex(token.slice(1, -1)),
      );
    }
    return parts.join("\n");
  }

  const lines = new Map<number, { x: number; text: string }[]>();
  for (const glyph of glyphs) {
    const key = Math.round(glyph.y);
    const row = lines.get(key) ?? [];
    row.push({ x: glyph.x, text: glyph.text });
    lines.set(key, row);
  }
  return [...lines.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, row]) =>
      row
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(" "),
    )
    .join("\n");
}

function tryInflate(data: Buffer): Buffer | null {
  for (const fn of [inflateSync, inflateRawSync]) {
    try {
      return fn(data);
    } catch {
      /* try next */
    }
  }
  if (data.length > 2 && data[0] === 0x78) {
    try {
      return inflateSync(data.subarray(2));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Inflate FlateDecode streams and pull Tj/TJ/hex strings.
 * Works on Vercel without canvas / DOMMatrix / workers.
 */
function slicePdfStreams(latin: string): Buffer[] {
  const streams: Buffer[] = [];
  const startRe = /stream\r?\n/g;
  let start: RegExpExecArray | null;
  while ((start = startRe.exec(latin))) {
    const from = start.index + start[0].length;
    const ahead = latin.slice(Math.max(0, start.index - 200), start.index);
    const lengthMatch = ahead.match(/\/Length\s+(\d+)/);
    if (lengthMatch) {
      const length = Number(lengthMatch[1]);
      streams.push(Buffer.from(latin.slice(from, from + length), "latin1"));
      startRe.lastIndex = from + length;
      continue;
    }
    const end = latin.indexOf("endstream", from);
    if (end === -1) break;
    streams.push(Buffer.from(latin.slice(from, end), "latin1"));
    startRe.lastIndex = end + 9;
  }
  return streams;
}

/**
 * Inflate FlateDecode streams and reconstruct Tj/Td lines.
 * Works on Vercel without canvas / DOMMatrix / workers.
 */
export function extractPdfTextFromStreams(buffer: Buffer): string {
  const latin = buffer.toString("latin1");
  const chunks: string[] = [extractPdfOperators(latin)];
  for (const raw of slicePdfStreams(latin)) {
    const inflated = tryInflate(raw);
    const payload = inflated ? inflated.toString("latin1") : raw.toString("latin1");
    chunks.push(extractPdfOperators(payload));
  }
  return chunks
    .join("\n")
    .replace(/\0/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

async function extractWithPdfParse(buffer: Buffer): Promise<string> {
  installPdfJsDomPolyfills();
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const pdfData = await parser.getText();
    return pdfData?.text != null && typeof pdfData.text === "string"
      ? pdfData.text
      : "";
  } finally {
    await parser.destroy();
  }
}

type PdfJsWorkerModule = {
  WorkerMessageHandler?: unknown;
  default?: { WorkerMessageHandler?: unknown };
};

async function pinPdfJsWorker(): Promise<void> {
  installPdfJsDomPolyfills();
  // Real file under src/ — do not import pdfjs-dist's worker from pnpm
  // node_modules (symlink). Vercel patchBuild rejects those paths.
  const worker = (await import(
    "./vendor/pdf.worker.min.mjs"
  )) as PdfJsWorkerModule;
  const handler =
    worker.WorkerMessageHandler ??
    worker.default?.WorkerMessageHandler ??
    (globalThis as { pdfjsWorker?: { WorkerMessageHandler?: unknown } })
      .pdfjsWorker?.WorkerMessageHandler;
  if (!handler) {
    throw new Error("pdfjs worker missing WorkerMessageHandler");
  }
  (globalThis as Record<string, unknown>).pdfjsWorker = {
    WorkerMessageHandler: handler,
  };
}

async function loadPdfJs() {
  await pinPdfJsWorker();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "./vendor/pdf.worker.min.mjs",
    import.meta.url,
  ).href;
  return pdfjs;
}

async function extractWithPdfJsLegacy(
  buffer: Buffer,
  password?: string,
): Promise<string> {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({
    data,
    ...(password ? { password } : {}),
    verbosity: 0,
    isOffscreenCanvasSupported: false,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const textParts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    textParts.push(reconstructPdfJsPageText(textContent.items));
  }
  await pdf.destroy();
  return textParts.join("\n");
}

/**
 * pdf-parse / pdfjs default getText follows item order + hasEOL.
 * Sorting by Y interleaves UBA date-wrap cells (`10-Mar-` then `2024` at a
 * lower Y) with narration, so wrap-repair never sees `10-Mar-\n2024`.
 */
function reconstructPdfJsPageText(items: unknown[]): string {
  let text = "";
  for (const item of items) {
    if (!item || typeof item !== "object" || !("str" in item)) continue;
    const row = item as { str?: string; hasEOL?: boolean };
    text += row.str ?? "";
    if (row.hasEOL) text += "\n";
  }
  return text.replace(/[ \t]+\n/g, "\n").trim();
}

function isUsableText(text: string): boolean {
  return text.replace(/\s+/g, " ").trim().length >= 50;
}

async function withTimeout<T>(
  work: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Extract statement text. On Vercel skip pdf-parse (nested pdfjs worker is
 * not traced). Use pdfjs with the worker pinned on this thread, then streams.
 * Never throws for extract failures — callers decide EMPTY_PDF.
 */
export async function extractPdfText(
  buffer: Buffer,
  password?: string,
): Promise<{ text: string; source: "pdf-parse" | "pdfjs" | "streams" | "none" }> {
  installPdfJsDomPolyfills();

  // pdf-parse ships pdfjs 5.4 and `import("./pdf.worker.mjs")` (webpackIgnore).
  // Vercel NFT drops that worker; getText() then throws and we used to fall
  // through to header-only streams. Skip pdf-parse on Vercel and use our
  // pinned pdfjs-dist 5.5 worker instead.
  if (!password && !process.env.VERCEL) {
    try {
      const text = await withTimeout(
        extractWithPdfParse(buffer),
        8_000,
        "pdf-parse",
      );
      if (isUsableText(text)) return { text, source: "pdf-parse" };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.toLowerCase().includes("password")) {
        throw new Error("PASSWORD_REQUIRED");
      }
      console.log("PDF text extraction failed:", errMsg);
    }
  }

  try {
    const text = await withTimeout(
      extractWithPdfJsLegacy(buffer, password),
      process.env.VERCEL ? 20_000 : 8_000,
      "pdfjs",
    );
    if (isUsableText(text)) return { text, source: "pdfjs" };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.toLowerCase().includes("password") || errMsg.includes("correct password")) {
      throw new Error("PASSWORD_REQUIRED");
    }
    console.log("PDF.js text extraction failed:", errMsg);
  }

  const streamed = extractPdfTextFromStreams(buffer);
  if (isUsableText(streamed)) {
    return { text: streamed, source: "streams" };
  }

  return { text: streamed, source: "none" };
}
