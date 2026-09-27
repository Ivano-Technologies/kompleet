/**
 * IVA-83 — locked import error taxonomy + copy.
 * Maps API / client failure signals to one errorCode. UI never shows a
 * generic-only “Upload failed. Please try again.”
 */

import { getBankConfig } from "./bank-configs";

export const IMPORT_ERROR_CODES = [
  "ERR_NETWORK",
  "ERR_UPLOAD",
  "ERR_UNSUPPORTED_FORMAT",
  "ERR_PARSE_LAYOUT",
  "ERR_BANK_UNKNOWN",
  "ERR_BANK_PARSE",
  "ERR_EMPTY",
  "ERR_SIZE_LIMIT",
  "ERR_PASSWORD",
  "ERR_UNKNOWN",
] as const;

export type ImportErrorCode = (typeof IMPORT_ERROR_CODES)[number];

export type ImportErrorAction =
  | "retry"
  | "retry-upload"
  | "choose-file"
  | "try-csv"
  | "select-bank"
  | "advanced"
  | "unlock";

export const IMPORT_ERROR_COPY = {
  network: {
    title: "Upload didn’t finish",
    body: "Check your connection, then retry. Your file wasn’t saved.",
    primary: "Retry upload",
  },
  upload: {
    title: "We couldn’t upload this file",
    body: "Something went wrong sending the file. Retry, or pick another statement.",
    primary: "Retry upload",
  },
  unsupported: {
    title: "This file type isn’t supported",
    body: "Use a bank statement as CSV, Excel, or PDF.",
    primary: "Choose different file",
  },
  parse: {
    title: "We couldn’t read this statement",
    body: "The layout doesn’t match what we support yet. Try exporting CSV from your bank, or pick another file.",
    primary: "Try CSV instead",
  },
  bankUnknown: {
    title: "We couldn’t tell which bank this is",
    body: "Select your bank and try again, or export CSV from internet banking.",
    primary: "Select bank",
  },
  bankParse: {
    title: "We found {Bank} but couldn’t read the layout",
    body: "Try a CSV export from {Bank}, or choose a different statement.",
    primary: "Try CSV instead",
  },
  ubaLayout: {
    title: "We couldn’t read this statement layout",
    body: "This UBA statement doesn’t match a layout we support yet. Export CSV from UBA internet banking and import that.",
    pdf: "This UBA PDF doesn’t match a layout we support yet. Export CSV from UBA internet banking and import that.",
    excel:
      "This UBA Excel export doesn’t match a layout we support yet. Export CSV from UBA internet banking and import that.",
    csv: "This UBA CSV export doesn’t match a layout we support yet. Try another export from UBA internet banking.",
    primary: "Try CSV instead",
  },
  empty: {
    title: "No transactions found",
    body: "This file looks empty or has no rows we can import. Pick another statement period.",
    primary: "Choose different file",
  },
  size: {
    title: "This file is too large",
    body: "Split the statement by month, or export a shorter CSV, then try again.",
    primary: "Choose different file",
  },
  password: {
    title: "This PDF is password-protected",
    body: "Enter the PDF password to continue.",
    primary: "Unlock",
  },
  unknown: {
    title: "Import didn’t complete",
    body: "We hit an unexpected problem with this file. Retry once, or try CSV from your bank.",
    primary: "Retry",
  },
  secondary: {
    chooseFile: "Choose different file",
    tryCsv: "Try CSV instead",
    advanced: "Advanced · choose bank",
  },
  dismiss: "Dismiss",
  toast: {
    network: "Upload didn’t finish — retry when you’re back online",
    upload: "Upload didn’t finish — retry when you’re back online",
  },
} as const;

export const GENERIC_RETRY_COPY = "Upload failed. Please try again.";

const LAYOUT_ERROR_TYPES = new Set([
  "EMPTY_PDF",
  "HEADER_MISMATCH",
  "PDF_PARSE_ERROR",
  "FILE_PARSING_ERROR",
  "LLM_EXTRACTION_ERROR",
  "NO_API_KEY",
]);

const EMPTY_ERROR_TYPES = new Set(["EMPTY_FILE", "NO_ROWS"]);

export interface ImportErrorSignal {
  errorCode?: string | null;
  status?: number;
  message?: string | null;
  error?: string | null;
  requiresPassword?: boolean;
  requestedBankCode?: string | null;
  detectedBankCode?: string | null;
  bankCode?: string | null;
  fileName?: string | null;
  parseErrorType?: string | null;
  clientKind?: "network" | "unsupported" | "size" | "json";
}

export interface ClassifiedImportError {
  code: ImportErrorCode;
  bankCode?: string;
  bankName?: string;
}

export interface ImportErrorViewModel {
  code: ImportErrorCode;
  title: string;
  body: string;
  primary: { label: string; action: ImportErrorAction };
  secondary?: { label: string; action: ImportErrorAction };
  tertiary?: { label: string; action: ImportErrorAction };
  toastTitle: string;
  toastBody?: string;
  showToast: boolean;
  showInlineCard: boolean;
  revealBankPicker: boolean;
  showPasswordField: boolean;
  useUbaLayout: boolean;
}

function interpolateBank(template: string, bankName: string): string {
  return template.replaceAll("{Bank}", bankName);
}

export function isImportErrorCode(value: string | null | undefined): value is ImportErrorCode {
  return Boolean(value && IMPORT_ERROR_CODES.includes(value as ImportErrorCode));
}

export function bankDisplayName(code?: string | null): string | undefined {
  if (!code) return undefined;
  const config = getBankConfig(code);
  if (config && config.code !== "AUTO" && config.code !== "GENERIC") {
    return config.name;
  }
  return undefined;
}

export type StatementFormatKind = "pdf" | "excel" | "csv" | "unknown";

export function statementFormatKind(
  fileName?: string | null,
): StatementFormatKind {
  const name = fileName?.toLowerCase() ?? "";
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "excel";
  if (name.endsWith(".csv")) return "csv";
  return "unknown";
}

export function ubaLayoutBody(fileName?: string | null): string {
  const kind = statementFormatKind(fileName);
  if (kind === "pdf") return IMPORT_ERROR_COPY.ubaLayout.pdf;
  if (kind === "excel") return IMPORT_ERROR_COPY.ubaLayout.excel;
  if (kind === "csv") return IMPORT_ERROR_COPY.ubaLayout.csv;
  return IMPORT_ERROR_COPY.ubaLayout.body;
}

export function looksLikeUba(signal: {
  bankCode?: string | null;
  detectedBankCode?: string | null;
  requestedBankCode?: string | null;
  fileName?: string | null;
  bankName?: string | null;
}): boolean {
  const tokens = [
    signal.bankCode,
    signal.detectedBankCode,
    signal.requestedBankCode,
    signal.bankName,
    signal.fileName,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toUpperCase());
  return tokens.some((value) => /\bUBA\b/.test(value) || value.includes("UNITED BANK"));
}

function specificBankCode(code?: string | null): string | undefined {
  const upper = code?.trim().toUpperCase();
  if (!upper || upper === "AUTO" || upper === "GENERIC") return undefined;
  return upper;
}

function effectiveBankCode(signal: ImportErrorSignal): string | undefined {
  return (
    specificBankCode(signal.bankCode) ??
    specificBankCode(signal.detectedBankCode) ??
    specificBankCode(signal.requestedBankCode) ??
    (looksLikeUba(signal) ? "UBA" : undefined)
  );
}

function messageBlob(signal: ImportErrorSignal): string {
  return `${signal.error ?? ""} ${signal.message ?? ""}`.toLowerCase();
}

export function classifyImportFailure(
  signal: ImportErrorSignal,
): ClassifiedImportError {
  if (signal.requiresPassword) {
    return { code: "ERR_PASSWORD" };
  }

  if (isImportErrorCode(signal.errorCode)) {
    const bankCode = effectiveBankCode(signal);
    return {
      code: signal.errorCode,
      bankCode,
      bankName: bankDisplayName(bankCode),
    };
  }

  if (signal.clientKind === "unsupported") {
    return { code: "ERR_UNSUPPORTED_FORMAT" };
  }
  if (signal.clientKind === "size" || signal.status === 413) {
    return { code: "ERR_SIZE_LIMIT" };
  }
  if (
    signal.clientKind === "network" ||
    signal.status === 0 ||
    signal.status === 408 ||
    signal.status === 502 ||
    signal.status === 503 ||
    signal.status === 504
  ) {
    return { code: "ERR_NETWORK" };
  }

  const text = messageBlob(signal);
  if (text.includes("password")) {
    return { code: "ERR_PASSWORD" };
  }
  if (
    text.includes("unsupported file") ||
    text.includes("file type") ||
    text.includes("cannot detect file type")
  ) {
    return { code: "ERR_UNSUPPORTED_FORMAT" };
  }
  if (
    text.includes("too large") ||
    text.includes("file size") ||
    text.includes("exceeds maximum")
  ) {
    return { code: "ERR_SIZE_LIMIT" };
  }
  if (signal.status === 401 || text.includes("unauthorized") || text.includes("sign in")) {
    return { code: "ERR_UPLOAD" };
  }
  if (signal.clientKind === "json") {
    return { code: "ERR_NETWORK" };
  }

  const bankCode = effectiveBankCode(signal);
  const bankName = bankDisplayName(bankCode);
  const parseType = signal.parseErrorType ?? "";
  const requested = signal.requestedBankCode?.toUpperCase();
  const detected = signal.detectedBankCode?.toUpperCase() ?? null;

  if (
    text.includes("no valid transaction") ||
    text.includes("no transactions") ||
    text.includes("empty") ||
    parseType ||
    signal.status === 400
  ) {
    if (requested === "AUTO" && (!detected || detected === "GENERIC") && !bankCode) {
      return { code: "ERR_BANK_UNKNOWN" };
    }
    if (EMPTY_ERROR_TYPES.has(parseType) && !LAYOUT_ERROR_TYPES.has(parseType)) {
      return { code: "ERR_EMPTY", bankCode, bankName };
    }
    if (LAYOUT_ERROR_TYPES.has(parseType) || text.includes("layout") || text.includes("header")) {
      if (bankCode && bankCode !== "AUTO" && bankCode !== "GENERIC") {
        return { code: "ERR_BANK_PARSE", bankCode, bankName };
      }
      if (requested === "AUTO" && (!detected || detected === "GENERIC")) {
        return { code: "ERR_BANK_UNKNOWN" };
      }
      return { code: "ERR_PARSE_LAYOUT", bankCode, bankName };
    }
    if (bankCode && bankCode !== "AUTO" && bankCode !== "GENERIC") {
      return { code: "ERR_BANK_PARSE", bankCode, bankName };
    }
    if (requested === "AUTO" && (!detected || detected === "GENERIC")) {
      return { code: "ERR_BANK_UNKNOWN" };
    }
    if (text.includes("no valid transaction") || text.includes("no transactions")) {
      if (!parseType) {
        return { code: "ERR_EMPTY", bankCode, bankName };
      }
    }
    return { code: "ERR_PARSE_LAYOUT", bankCode, bankName };
  }

  if (signal.status !== undefined && signal.status >= 500) {
    return { code: "ERR_UNKNOWN", bankCode, bankName };
  }

  return { code: "ERR_UNKNOWN", bankCode, bankName };
}

export function viewModelForImportError(
  classified: ClassifiedImportError,
  extras?: { fileName?: string | null },
): ImportErrorViewModel {
  const useUbaLayout =
    classified.code === "ERR_BANK_PARSE" &&
    looksLikeUba({
      bankCode: classified.bankCode,
      bankName: classified.bankName,
      fileName: extras?.fileName,
    });
  const bankName = classified.bankName ?? "your bank";

  const base: Omit<
    ImportErrorViewModel,
    | "title"
    | "body"
    | "primary"
    | "secondary"
    | "tertiary"
    | "toastTitle"
    | "toastBody"
    | "showToast"
    | "showInlineCard"
    | "revealBankPicker"
    | "showPasswordField"
  > = {
    code: classified.code,
    useUbaLayout,
  };

  switch (classified.code) {
    case "ERR_NETWORK":
      return {
        ...base,
        title: IMPORT_ERROR_COPY.network.title,
        body: IMPORT_ERROR_COPY.network.body,
        primary: {
          label: IMPORT_ERROR_COPY.network.primary,
          action: "retry-upload",
        },
        secondary: {
          label: IMPORT_ERROR_COPY.secondary.chooseFile,
          action: "choose-file",
        },
        toastTitle: "Upload issue",
        toastBody: IMPORT_ERROR_COPY.toast.network,
        showToast: true,
        showInlineCard: true,
        revealBankPicker: false,
        showPasswordField: false,
      };
    case "ERR_UPLOAD":
      return {
        ...base,
        title: IMPORT_ERROR_COPY.upload.title,
        body: IMPORT_ERROR_COPY.upload.body,
        primary: {
          label: IMPORT_ERROR_COPY.upload.primary,
          action: "retry-upload",
        },
        secondary: {
          label: IMPORT_ERROR_COPY.secondary.chooseFile,
          action: "choose-file",
        },
        toastTitle: "Upload issue",
        toastBody: IMPORT_ERROR_COPY.toast.upload,
        showToast: true,
        showInlineCard: true,
        revealBankPicker: false,
        showPasswordField: false,
      };
    case "ERR_UNSUPPORTED_FORMAT":
      return {
        ...base,
        title: IMPORT_ERROR_COPY.unsupported.title,
        body: IMPORT_ERROR_COPY.unsupported.body,
        primary: {
          label: IMPORT_ERROR_COPY.unsupported.primary,
          action: "choose-file",
        },
        toastTitle: IMPORT_ERROR_COPY.unsupported.title,
        showToast: false,
        showInlineCard: true,
        revealBankPicker: false,
        showPasswordField: false,
      };
    case "ERR_PARSE_LAYOUT":
      return {
        ...base,
        title: IMPORT_ERROR_COPY.parse.title,
        body: IMPORT_ERROR_COPY.parse.body,
        primary: {
          label: IMPORT_ERROR_COPY.parse.primary,
          action: "try-csv",
        },
        secondary: {
          label: IMPORT_ERROR_COPY.secondary.chooseFile,
          action: "choose-file",
        },
        toastTitle: IMPORT_ERROR_COPY.parse.title,
        showToast: false,
        showInlineCard: true,
        revealBankPicker: false,
        showPasswordField: false,
      };
    case "ERR_BANK_UNKNOWN":
      return {
        ...base,
        title: IMPORT_ERROR_COPY.bankUnknown.title,
        body: IMPORT_ERROR_COPY.bankUnknown.body,
        primary: {
          label: IMPORT_ERROR_COPY.bankUnknown.primary,
          action: "select-bank",
        },
        secondary: {
          label: IMPORT_ERROR_COPY.secondary.tryCsv,
          action: "try-csv",
        },
        toastTitle: IMPORT_ERROR_COPY.bankUnknown.title,
        showToast: false,
        showInlineCard: true,
        revealBankPicker: true,
        showPasswordField: false,
      };
    case "ERR_BANK_PARSE":
      if (useUbaLayout) {
        return {
          ...base,
          title: IMPORT_ERROR_COPY.ubaLayout.title,
          body: ubaLayoutBody(extras?.fileName),
          primary: {
            label: IMPORT_ERROR_COPY.ubaLayout.primary,
            action: "try-csv",
          },
          secondary: {
            label: IMPORT_ERROR_COPY.secondary.chooseFile,
            action: "choose-file",
          },
          tertiary: {
            label: IMPORT_ERROR_COPY.secondary.advanced,
            action: "advanced",
          },
          toastTitle: IMPORT_ERROR_COPY.ubaLayout.title,
          showToast: false,
          showInlineCard: true,
          revealBankPicker: false,
          showPasswordField: false,
        };
      }
      return {
        ...base,
        title: interpolateBank(IMPORT_ERROR_COPY.bankParse.title, bankName),
        body: interpolateBank(IMPORT_ERROR_COPY.bankParse.body, bankName),
        primary: {
          label: IMPORT_ERROR_COPY.bankParse.primary,
          action: "try-csv",
        },
        secondary: {
          label: IMPORT_ERROR_COPY.secondary.advanced,
          action: "advanced",
        },
        toastTitle: interpolateBank(IMPORT_ERROR_COPY.bankParse.title, bankName),
        showToast: false,
        showInlineCard: true,
        revealBankPicker: false,
        showPasswordField: false,
      };
    case "ERR_EMPTY":
      return {
        ...base,
        title: IMPORT_ERROR_COPY.empty.title,
        body: IMPORT_ERROR_COPY.empty.body,
        primary: {
          label: IMPORT_ERROR_COPY.empty.primary,
          action: "choose-file",
        },
        toastTitle: IMPORT_ERROR_COPY.empty.title,
        showToast: false,
        showInlineCard: true,
        revealBankPicker: false,
        showPasswordField: false,
      };
    case "ERR_SIZE_LIMIT":
      return {
        ...base,
        title: IMPORT_ERROR_COPY.size.title,
        body: IMPORT_ERROR_COPY.size.body,
        primary: {
          label: IMPORT_ERROR_COPY.size.primary,
          action: "choose-file",
        },
        toastTitle: IMPORT_ERROR_COPY.size.title,
        showToast: false,
        showInlineCard: true,
        revealBankPicker: false,
        showPasswordField: false,
      };
    case "ERR_PASSWORD":
      return {
        ...base,
        title: IMPORT_ERROR_COPY.password.title,
        body: IMPORT_ERROR_COPY.password.body,
        primary: {
          label: IMPORT_ERROR_COPY.password.primary,
          action: "unlock",
        },
        secondary: {
          label: IMPORT_ERROR_COPY.secondary.chooseFile,
          action: "choose-file",
        },
        toastTitle: IMPORT_ERROR_COPY.password.title,
        showToast: false,
        showInlineCard: true,
        revealBankPicker: false,
        showPasswordField: true,
      };
    default:
      return {
        ...base,
        title: IMPORT_ERROR_COPY.unknown.title,
        body: IMPORT_ERROR_COPY.unknown.body,
        primary: {
          label: IMPORT_ERROR_COPY.unknown.primary,
          action: "retry",
        },
        secondary: {
          label: IMPORT_ERROR_COPY.secondary.tryCsv,
          action: "try-csv",
        },
        toastTitle: IMPORT_ERROR_COPY.unknown.title,
        showToast: false,
        showInlineCard: true,
        revealBankPicker: false,
        showPasswordField: false,
      };
  }
}

export function formatFileSizeLabel(bytes?: number | null): string | undefined {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes) || bytes < 0) {
    return undefined;
  }
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function classifyClientException(
  error: unknown,
): ImportErrorSignal["clientKind"] | undefined {
  if (error instanceof DOMException && error.name === "AbortError") {
    return undefined;
  }
  if (error instanceof TypeError) return "network";
  if (error instanceof SyntaxError) return "json";
  if (error instanceof Error && /failed to fetch|network/i.test(error.message)) {
    return "network";
  }
  return "network";
}
