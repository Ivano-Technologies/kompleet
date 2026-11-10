/**
 * Shared upload checks for Convex and Next.js: filename sanitising, size caps,
 * magic-byte sniffing, and a blocklist for HTML / SVG / executables.
 */

export type UploadKind = "library" | "image" | "statement" | "ingest";

export type SafeUpload = {
  filename: string;
  contentType: string;
  sniffed:
    | "pdf"
    | "png"
    | "jpeg"
    | "webp"
    | "csv"
    | "xlsx"
    | "xls"
    | "zip";
};

export const LIBRARY_MAX_BYTES = 10 * 1024 * 1024;
export const RECEIPT_MAX_BYTES = 8 * 1024 * 1024;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const STATEMENT_MAX_BYTES = 10 * 1024 * 1024;
export const OCR_MAX_BYTES = 8 * 1024 * 1024;
export const INGEST_MAX_BYTES = 100 * 1024 * 1024;

const BLOCKED_EXTENSIONS = [
  ".html",
  ".htm",
  ".shtml",
  ".svg",
  ".svgz",
  ".js",
  ".mjs",
  ".cjs",
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".dll",
  ".scr",
  ".php",
  ".phtml",
  ".wasm",
] as const;

const LIBRARY_SNIFF = new Set(["pdf", "png", "jpeg", "webp", "csv", "xlsx", "xls"]);
const IMAGE_SNIFF = new Set(["png", "jpeg", "webp"]);
const STATEMENT_SNIFF = new Set(["pdf", "csv", "xlsx", "xls"]);
const INGEST_SNIFF = new Set(["pdf", "csv", "xlsx", "xls", "zip"]);

export function sanitizeFilename(raw: string): string {
  const trimmed = raw.replace(/\0/g, "").trim();
  const base = trimmed.split(/[/\\]/).pop() || "untitled";
  const cleaned = base
    .replace(/[<>:"|?*\u0000-\u001f]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 180);
  return cleaned.length > 0 ? cleaned : "untitled";
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return "";
  return filename.slice(dot).toLowerCase();
}

function looksLikeHtmlOrSvg(bytes: Uint8Array): boolean {
  const head = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.slice(0, 256))
    .replace(/^\uFEFF/, "")
    .trimStart()
    .toLowerCase();
  return (
    head.startsWith("<!doctype html") ||
    head.startsWith("<html") ||
    head.startsWith("<svg") ||
    head.startsWith("<?xml") && head.includes("<svg")
  );
}

function sniffBytes(bytes: Uint8Array): SafeUpload["sniffed"] | "blocked" | "unknown" {
  if (bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a) {
    return "blocked";
  }
  if (looksLikeHtmlOrSvg(bytes)) {
    return "blocked";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "pdf";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  ) {
    return "xlsx";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0
  ) {
    return "xls";
  }
  return "unknown";
}

function contentTypeFor(sniffed: SafeUpload["sniffed"]): string {
  switch (sniffed) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "csv":
      return "text/csv";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "xls":
      return "application/vnd.ms-excel";
    case "zip":
      return "application/zip";
    default: {
      const _exhaustive: never = sniffed;
      return _exhaustive;
    }
  }
}

function extensionsFor(sniffed: SafeUpload["sniffed"]): string[] {
  switch (sniffed) {
    case "pdf":
      return [".pdf"];
    case "png":
      return [".png"];
    case "jpeg":
      return [".jpg", ".jpeg"];
    case "webp":
      return [".webp"];
    case "csv":
      return [".csv"];
    case "xlsx":
      return [".xlsx"];
    case "xls":
      return [".xls"];
    case "zip":
      return [".zip"];
    default: {
      const _exhaustive: never = sniffed;
      return _exhaustive;
    }
  }
}

function rejectMessage(kind: UploadKind): string {
  switch (kind) {
    case "library":
      return "Use PDF, image, or CSV.";
    case "image":
      return "Please select an image file";
    case "statement":
      return "Unsupported file type. Please upload CSV, Excel, or PDF files.";
    case "ingest":
      return "Unsupported file type. Please upload CSV, Excel, PDF, or ZIP files.";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function allowedSet(kind: UploadKind): Set<string> {
  switch (kind) {
    case "library":
      return LIBRARY_SNIFF;
    case "image":
      return IMAGE_SNIFF;
    case "statement":
      return STATEMENT_SNIFF;
    case "ingest":
      return INGEST_SNIFF;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function inspectUpload(args: {
  filename: string;
  contentType?: string;
  bytes: Uint8Array;
  size: number;
  maxBytes: number;
  kind: UploadKind;
}): SafeUpload {
  if (args.size > args.maxBytes) {
    throw new Error(`File size must be less than ${Math.floor(args.maxBytes / (1024 * 1024))}MB`);
  }
  const filename = sanitizeFilename(args.filename);
  const ext = extensionOf(filename);
  if ((BLOCKED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new Error("This file type is not allowed.");
  }

  let sniffed = sniffBytes(args.bytes);
  if (sniffed === "xlsx" && ext === ".zip") {
    sniffed = "zip";
  }
  if (sniffed === "unknown" && (ext === ".csv" || args.contentType?.includes("csv"))) {
    sniffed = "csv";
  }
  if (sniffed === "blocked" || sniffed === "unknown") {
    throw new Error(rejectMessage(args.kind));
  }
  if (!allowedSet(args.kind).has(sniffed)) {
    throw new Error(rejectMessage(args.kind));
  }
  const expected = extensionsFor(sniffed);
  if (ext && !expected.includes(ext)) {
    throw new Error(rejectMessage(args.kind));
  }
  const named = ext ? filename : `${filename}${expected[0]}`;
  return {
    filename: named,
    contentType: contentTypeFor(sniffed),
    sniffed,
  };
}

/** Attachment so HTML/SVG that slipped through is not executed inline. */
export const DOWNLOAD_DISPOSITION = "attachment";
