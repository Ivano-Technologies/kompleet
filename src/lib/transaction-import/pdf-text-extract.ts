/**
 * Serverless-safe PDF text extraction.
 * Preview/Vercel cannot load @napi-rs/canvas; pdf-parse then throws
 * DOMMatrix and the previous tesseract OCR path hung until a 504.
 */

import { inflateSync, inflateRawSync } from "node:zlib";
import { installPdfJsDomPolyfills } from "./pdf-dom-polyfill";
import { looksLikeUbaTableStatement } from "./statement-text-parser";

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

async function extractWithPdfJsLegacy(
  buffer: Buffer,
  password?: string,
): Promise<string> {
  installPdfJsDomPolyfills();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
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
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str || "" : ""))
      .join(" ");
    textParts.push(pageText);
  }
  await pdf.destroy();
  return textParts.join("\n");
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
 * Extract statement text. Prefer pdf-parse (with DOM polyfills), then
 * pdfjs legacy, then raw FlateDecode streams. Never throws for extract
 * failures — callers decide EMPTY_PDF.
 */
export async function extractPdfText(
  buffer: Buffer,
  password?: string,
): Promise<{ text: string; source: "pdf-parse" | "pdfjs" | "streams" | "none" }> {
  installPdfJsDomPolyfills();

  // Vercel has no @napi-rs/canvas; pdfjs/pdf-parse throw or hang. Streams first.
  if (process.env.VERCEL) {
    const streamed = extractPdfTextFromStreams(buffer);
    if (
      isUsableText(streamed) &&
      (looksLikeUbaTableStatement(streamed) ||
        (streamed.match(/\d{1,2}-[A-Za-z]{3}-\d{2,4}/g) ?? []).length >= 4)
    ) {
      return { text: streamed, source: "streams" };
    }
  }

  if (!password) {
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
      8_000,
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
