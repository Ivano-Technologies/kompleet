/**
 * IVA-83: locked taxonomy → copy mapping (no generic retry-only string).
 */

import { describe, expect, it } from "vitest";
import {
  GENERIC_RETRY_COPY,
  IMPORT_ERROR_CODES,
  IMPORT_ERROR_COPY,
  classifyImportFailure,
  viewModelForImportError,
} from "@/lib/transaction-import/import-errors";

describe("IVA-83 import error taxonomy", () => {
  it("maps every locked code to title, body, and an allowed primary CTA", () => {
    const allowedPrimaries = new Set([
      "Retry",
      "Retry upload",
      "Choose different file",
      "Try CSV instead",
      "Select bank",
      "Unlock",
    ]);

    for (const code of IMPORT_ERROR_CODES) {
      const view = viewModelForImportError({
        code,
        bankCode: code === "ERR_BANK_PARSE" ? "GTB" : undefined,
        bankName: code === "ERR_BANK_PARSE" ? "GTBank" : undefined,
      });
      expect(view.title.length).toBeGreaterThan(0);
      expect(view.body.length).toBeGreaterThan(0);
      expect(allowedPrimaries.has(view.primary.label)).toBe(true);
      expect(view.title).not.toBe(GENERIC_RETRY_COPY);
      expect(view.body).not.toBe(GENERIC_RETRY_COPY);
    }
  });

  it("uses dedicated UBA layout copy for ERR_BANK_PARSE + UBA", () => {
    const view = viewModelForImportError(
      { code: "ERR_BANK_PARSE", bankCode: "UBA", bankName: "UBA" },
      { fileName: "UBA-BAYEK-2024.pdf" },
    );
    expect(view.useUbaLayout).toBe(true);
    expect(view.title).toBe(IMPORT_ERROR_COPY.ubaLayout.title);
    expect(view.body).toBe(IMPORT_ERROR_COPY.ubaLayout.pdf);
    expect(view.primary.label).toBe("Try CSV instead");
    expect(view.secondary?.label).toBe("Choose different file");
    expect(view.tertiary?.label).toBe("Advanced · choose bank");
  });

  it("does not call a UBA Excel miss a PDF", () => {
    const view = viewModelForImportError(
      { code: "ERR_BANK_PARSE", bankCode: "UBA", bankName: "UBA" },
      { fileName: "OpTransactionHistoryUX527-09092026.xls" },
    );
    expect(view.useUbaLayout).toBe(true);
    expect(view.body).toBe(IMPORT_ERROR_COPY.ubaLayout.excel);
    expect(view.body).not.toMatch(/PDF/i);
    expect(view.body).toMatch(/Excel/i);
  });

  it("interpolates {Bank} for non-UBA bank parse misses", () => {
    const view = viewModelForImportError({
      code: "ERR_BANK_PARSE",
      bankCode: "GTB",
      bankName: "GTBank",
    });
    expect(view.title).toBe("We found GTBank but couldn’t read the layout");
    expect(view.body).toContain("GTBank");
    expect(view.secondary?.action).toBe("advanced");
  });

  it("classifies client and API signals to the most specific code", () => {
    expect(
      classifyImportFailure({ clientKind: "network" }).code,
    ).toBe("ERR_NETWORK");
    expect(
      classifyImportFailure({ clientKind: "unsupported" }).code,
    ).toBe("ERR_UNSUPPORTED_FORMAT");
    expect(
      classifyImportFailure({ clientKind: "size" }).code,
    ).toBe("ERR_SIZE_LIMIT");
    expect(
      classifyImportFailure({ requiresPassword: true }).code,
    ).toBe("ERR_PASSWORD");
    expect(
      classifyImportFailure({
        status: 400,
        error: "No valid transactions found",
        requestedBankCode: "AUTO",
        detectedBankCode: null,
      }).code,
    ).toBe("ERR_BANK_UNKNOWN");
    expect(
      classifyImportFailure({
        status: 400,
        error: "Could not extract text from PDF",
        parseErrorType: "EMPTY_PDF",
        requestedBankCode: "UBA",
        bankCode: "UBA",
        fileName: "UBA-BAYEK-2024.pdf",
      }).code,
    ).toBe("ERR_BANK_PARSE");
    expect(
      classifyImportFailure({
        status: 400,
        error: "No valid transactions found",
      }).code,
    ).toBe("ERR_EMPTY");
    expect(
      classifyImportFailure({
        status: 400,
        error: "HEADER_MISMATCH",
        parseErrorType: "HEADER_MISMATCH",
        requestedBankCode: "GENERIC",
      }).code,
    ).toBe("ERR_PARSE_LAYOUT");
    expect(
      classifyImportFailure({ status: 401, error: "Unauthorized" }).code,
    ).toBe("ERR_UPLOAD");
    expect(
      classifyImportFailure({ status: 504, error: "Gateway Timeout" }).code,
    ).toBe("ERR_NETWORK");
    expect(
      classifyImportFailure({ status: 500, error: "boom" }).code,
    ).toBe("ERR_UNKNOWN");
  });

  it("network/upload views toast; parse/format/bank stay inline-only", () => {
    expect(viewModelForImportError({ code: "ERR_NETWORK" }).showToast).toBe(
      true,
    );
    expect(viewModelForImportError({ code: "ERR_UPLOAD" }).showToast).toBe(true);
    expect(
      viewModelForImportError({ code: "ERR_BANK_UNKNOWN" }).revealBankPicker,
    ).toBe(true);
    expect(
      viewModelForImportError({ code: "ERR_PARSE_LAYOUT" }).showToast,
    ).toBe(false);
    expect(
      viewModelForImportError({ code: "ERR_PASSWORD" }).showPasswordField,
    ).toBe(true);
  });
});
