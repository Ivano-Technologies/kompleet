import { DOCS_COPY, DOCS_MAX_BYTES } from "./docs-copy";

export type FileKind = "pdf" | "image" | "csv" | "other";
export type DocsFilter =
  | "all"
  | "pdf"
  | "images"
  | "csv"
  | "attached"
  | "unattached";
export type LinkType = "transaction" | "invoice" | "expense";
export type FileSource =
  | "documents"
  | "invoice_drop"
  | "expense_attach"
  | "transaction_attach";

export interface LibraryFile {
  id: string;
  storageId: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: number;
  source: FileSource;
  kind: FileKind;
  linkType: LinkType | null;
  linkId: string | null;
  linkLabel: string | null;
}

export interface LinkTarget {
  id: string;
  label: string;
  amount: number | null;
  date: string | null;
  href: string;
}

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".csv",
  ".xlsx",
  ".xls",
] as const;

const STATEMENT_HINTS = [
  "statement",
  "bank",
  "gtb",
  "gtbank",
  "access",
  "zenith",
  "uba",
  "firstbank",
  "sterling",
  "fidelity",
  "kuda",
  "opay",
  "palmpay",
  "moniepoint",
  "wema",
  "unionbank",
  "fcmb",
  "polaris",
] as const;

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return "";
  return filename.slice(dot).toLowerCase();
}

export function classifyFileKind(
  filename: string,
  contentType = "",
): FileKind {
  const ext = extensionOf(filename);
  const mime = contentType.toLowerCase();
  if (ext === ".pdf" || mime === "application/pdf") return "pdf";
  if (
    ext === ".png" ||
    ext === ".jpg" ||
    ext === ".jpeg" ||
    ext === ".webp" ||
    mime.startsWith("image/")
  ) {
    return "image";
  }
  if (
    ext === ".csv" ||
    ext === ".xlsx" ||
    ext === ".xls" ||
    mime === "text/csv" ||
    mime.includes("spreadsheet")
  ) {
    return "csv";
  }
  return "other";
}

export function isAllowedDocsFile(file: File): boolean {
  const ext = extensionOf(file.name);
  return ALLOWED_EXTENSIONS.includes(
    ext as (typeof ALLOWED_EXTENSIONS)[number],
  );
}

export function rejectDocsFile(file: File): string | null {
  if (!isAllowedDocsFile(file)) return DOCS_COPY.toastReject;
  if (file.size > DOCS_MAX_BYTES) return DOCS_COPY.toastTooLarge;
  return null;
}

export function looksLikeBankStatement(
  filename: string,
  options?: { contentType?: string },
): boolean {
  const lower = filename.toLowerCase();
  const ext = extensionOf(lower);
  const mime = options?.contentType?.toLowerCase() ?? "";
  const statementExt =
    [".pdf", ".csv", ".xlsx", ".xls"].includes(ext) ||
    mime === "application/pdf" ||
    mime === "text/csv" ||
    mime.includes("spreadsheet");
  if (!statementExt) return false;
  return STATEMENT_HINTS.some((hint) => lower.includes(hint));
}

export function kindLabel(kind: FileKind): string {
  if (kind === "pdf") return "PDF";
  if (kind === "image") return "Image";
  if (kind === "csv") {
    return "CSV";
  }
  return "File";
}

export function linkHref(type: LinkType, id: string): string {
  if (type === "transaction") return `/transactions/${id}`;
  if (type === "invoice") return `/invoices/${id}`;
  return `/expenses/${id}`;
}

export function linkSurfaceLabel(type: LinkType): string {
  if (type === "transaction") return "Books";
  if (type === "invoice") return "Invoices";
  return "Expenses";
}
