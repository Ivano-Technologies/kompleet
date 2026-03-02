import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";
import type { OcrEnginePort } from "../../application/ports/ocr-engine.port";
import { normalizeText } from "../../application/extraction/normalize-text";

const execFileAsync = promisify(execFile);
const OCR_TIMEOUT_MS = 10_000;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface OcrToken {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export class TesseractAdapter implements OcrEnginePort {
  static async ensureBinaryAvailable(): Promise<void> {
    try {
      await execWithTimeout("tesseract", ["--version"]);
    } catch {
      throw new Error(
        "Tesseract binary not found. Install Tesseract and ensure it is on PATH.",
      );
    }
  }

  async extractStructuredData(params: {
    fileUrl: string;
    documentType: string;
  }): Promise<Record<string, unknown>> {
    const filePath = await materializeInputFile(params.fileUrl);

    try {
      const textOutput = await execWithTimeout("tesseract", [
        filePath,
        "stdout",
        "--oem",
        "1",
        "--psm",
        "6",
        "-l",
        "eng",
      ]);

      const tsvOutput = await execWithTimeout("tesseract", [
        filePath,
        "stdout",
        "--oem",
        "1",
        "--psm",
        "6",
        "-l",
        "eng",
        "tsv",
      ]);

      const normalizedText = normalizeText(textOutput.stdout);
      const tokens = parseTsvTokens(tsvOutput.stdout);
      const averageConfidence = computeAverageConfidence(tokens);
      const stats = await fs.stat(filePath);

      // Raw OCR content remains internal to module pipeline and is
      // redacted before persistence/response.
      return {
        sourceFile: params.fileUrl,
        documentType: params.documentType,
        rawText: normalizedText,
        boundingBoxes: tokens,
        confidenceScore: averageConfidence,
        textHash: createHash("sha256").update(normalizedText).digest("hex"),
        pageCount: 1,
        fileSizeBytes: stats.size,
      };
    } finally {
      await safeUnlink(filePath);
    }
  }
}

async function materializeInputFile(fileUrl: string): Promise<string> {
  if (fileUrl.startsWith("s3://")) {
    throw new Error("S3 URLs are unsupported directly. Use a pre-signed HTTPS URL.");
  }

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch OCR input file: ${response.statusText}`);
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `OCR input exceeds ${MAX_FILE_SIZE_BYTES} bytes limit for safety.`,
      );
    }

    const extension = extname(new URL(fileUrl).pathname) || ".bin";
    const tempPath = join(
      tmpdir(),
      `ocr-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`,
    );
    await fs.writeFile(tempPath, bytes);
    return tempPath;
  }

  if (fileUrl.startsWith("file://")) {
    const localPath = fileUrl.slice("file://".length);
    await validateLocalFile(localPath);
    return localPath;
  }

  await validateLocalFile(fileUrl);
  return fileUrl;
}

async function validateLocalFile(filePath: string): Promise<void> {
  const stats = await fs.stat(filePath);
  if (!stats.isFile()) {
    throw new Error(`OCR input path is not a file: ${basename(filePath)}`);
  }

  if (stats.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `OCR input exceeds ${MAX_FILE_SIZE_BYTES} bytes limit for safety.`,
    );
  }
}

async function execWithTimeout(command: string, args: string[]) {
  return Promise.race([
    execFileAsync(command, args, { maxBuffer: 10 * 1024 * 1024 }),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Tesseract OCR timed out after ${OCR_TIMEOUT_MS}ms (${command} ${args.join(" ")})`,
          ),
        );
      }, OCR_TIMEOUT_MS);
    }),
  ]);
}

function parseTsvTokens(tsv: string): OcrToken[] {
  const lines = tsv.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length <= 1) {
    return [];
  }

  const rows: OcrToken[] = [];
  for (const line of lines.slice(1)) {
    const fields = line.split("\t");
    if (fields.length < 12) {
      continue;
    }

    const text = normalizeText(fields[11] ?? "");
    const confidence = Number(fields[10] ?? "-1");
    if (!text || confidence < 0) {
      continue;
    }

    rows.push({
      text,
      x: Number(fields[6] ?? "0"),
      y: Number(fields[7] ?? "0"),
      width: Number(fields[8] ?? "0"),
      height: Number(fields[9] ?? "0"),
      confidence,
    });
  }

  return rows.sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.x !== b.x) return a.x - b.x;
    return a.text.localeCompare(b.text);
  });
}

function computeAverageConfidence(tokens: OcrToken[]): number {
  if (tokens.length === 0) {
    return 0;
  }

  const total = tokens.reduce((sum, token) => sum + token.confidence, 0);
  return Math.round((total / tokens.length) * 100) / 100;
}

async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // best-effort cleanup
  }
}
