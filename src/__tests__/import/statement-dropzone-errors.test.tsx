/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatementDropZone } from "@/components/import/StatementDropZone";
import { GENERIC_RETRY_COPY, IMPORT_ERROR_COPY } from "@/lib/transaction-import/import-errors";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dropZoneSource = readFileSync(
  resolve(process.cwd(), "src/components/import/StatementDropZone.tsx"),
  "utf8",
);

describe("IVA-83 StatementDropZone error surfaces", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not ship the generic retry-only string", () => {
    expect(dropZoneSource).not.toContain(GENERIC_RETRY_COPY);
    expect(dropZoneSource).not.toContain("Upload failed. Please try again.");
  });

  it("renders the unsupported-format card when a PNG is dropped", async () => {
    render(<StatementDropZone variant="strip" inputId="err-unsupported" />);

    const zone = screen.getByRole("button", {
      name: "Drop another statement to update books",
    });
    const file = new File(["fake"], "receipt-photo.png", { type: "image/png" });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });

    expect(
      await screen.findByRole("alert"),
    ).toHaveAttribute("data-import-error", "ERR_UNSUPPORTED_FORMAT");
    expect(
      screen.getByText(IMPORT_ERROR_COPY.unsupported.title),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose different file" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(GENERIC_RETRY_COPY)).toBeNull();
  });

  it("shows UBA layout copy for ERR_BANK_PARSE and keeps AUTO happy-path upload URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            errorCode: "ERR_BANK_PARSE",
            error: "No valid transactions found",
            bankCode: "UBA",
            detectedBankCode: "UBA",
          }),
      }),
    );

    const user = userEvent.setup();
    render(<StatementDropZone variant="hero" inputId="err-uba" />);

    const input = document.getElementById("err-uba") as HTMLInputElement;
    const file = new File(["%PDF-1.4"], "UBA-BAYEK-2024.pdf", {
      type: "application/pdf",
    });
    await user.upload(input, file);

    expect(await screen.findByRole("alert")).toHaveAttribute(
      "data-import-error",
      "ERR_BANK_PARSE",
    );
    expect(
      screen.getByText(IMPORT_ERROR_COPY.ubaLayout.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(IMPORT_ERROR_COPY.ubaLayout.body),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try CSV instead" }),
    ).toBeInTheDocument();
    expect(dropZoneSource).toMatch(/\/api\/transactions\/upload-v2/);
    expect(dropZoneSource).toMatch(/DEFAULT_BANK_CODE/);
  });

  it("reveals and focuses Advanced bank picker on ERR_BANK_UNKNOWN", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            errorCode: "ERR_BANK_UNKNOWN",
            error: "No valid transactions found",
            requestedBankCode: "AUTO",
            detectedBankCode: null,
          }),
      }),
    );

    const user = userEvent.setup();
    render(<StatementDropZone variant="compact" inputId="err-unknown-bank" />);

    const input = document.getElementById(
      "err-unknown-bank",
    ) as HTMLInputElement;
    const file = new File(["x".repeat(80)], "statement-export.pdf", {
      type: "application/pdf",
    });
    await user.upload(input, file);

    expect(await screen.findByRole("alert")).toHaveAttribute(
      "data-import-error",
      "ERR_BANK_UNKNOWN",
    );
    expect(
      screen.getByText(IMPORT_ERROR_COPY.bankUnknown.title),
    ).toBeInTheDocument();
    expect(screen.getByText("Advanced · choose bank")).toBeInTheDocument();
    const select = screen.getByRole("combobox");
    await waitFor(() => {
      expect(select).toHaveFocus();
    });
  });

  it("toasts Retry for network failures without the generic string", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const user = userEvent.setup();
    render(<StatementDropZone variant="strip" inputId="err-network" />);

    const input = document.getElementById("err-network") as HTMLInputElement;
    const file = new File(["a,b,c"], "zenith-mar-2026.csv", { type: "text/csv" });
    await user.upload(input, file);

    expect(await screen.findByRole("alert")).toHaveAttribute(
      "data-import-error",
      "ERR_NETWORK",
    );
    expect(screen.getByText(IMPORT_ERROR_COPY.network.title)).toBeInTheDocument();
    expect(
      screen.getByText(IMPORT_ERROR_COPY.toast.network),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Retry/ }).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText(GENERIC_RETRY_COPY)).toBeNull();
  });

  it("leaves Updating books… and classifies a 504 HTML body as ERR_NETWORK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 504,
        text: async () => "<html>Gateway Timeout</html>",
        json: async () => {
          throw new SyntaxError("Unexpected token <");
        },
      }),
    );

    const user = userEvent.setup();
    render(<StatementDropZone variant="hero" inputId="err-504" />);

    const input = document.getElementById("err-504") as HTMLInputElement;
    const file = new File(["%PDF-1.4"], "UBA-BAYEK-2024.pdf", {
      type: "application/pdf",
    });
    await user.upload(input, file);

    expect(await screen.findByRole("alert")).toHaveAttribute(
      "data-import-error",
      "ERR_NETWORK",
    );
    expect(screen.getByText(IMPORT_ERROR_COPY.network.title)).toBeInTheDocument();
    expect(screen.queryByText("Updating books…")).toBeNull();
    expect(screen.queryByText(GENERIC_RETRY_COPY)).toBeNull();
  });
});
