import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

describe("IVA-281 invoice status UI", () => {
  it("uses a destructive red confirm on the cancel dialog", () => {
    const dialogs = read("src/components/invoices/InvoiceStatusDialogs.tsx");
    const confirmAt = dialogs.indexOf("INV_COPY.cancelConfirm");
    const before = dialogs.slice(Math.max(0, confirmAt - 400), confirmAt);
    expect(before).toMatch(/bg-red-600/);
    expect(before).toMatch(/text-white/);
    expect(before).not.toMatch(/btn-secondary text-sm px-3 py-2 text-error/);
  });

  it("mutes cancelled amounts and hides the clipped detail pane below md", () => {
    const list = read("src/app/(dashboard)/invoices/page.tsx");
    expect(list).toMatch(/invoice\.status === "cancelled"/);
    expect(list).toMatch(/line-through/);
    expect(list).toMatch(/hidden min-w-0 md:flex flex-1/);
    expect(list).toMatch(/w-full md:w-80/);
    expect(list).toMatch(/overflow-x-hidden px-4/);
    expect(list).toMatch(/absolute left-3/);
    expect(list).toMatch(/pl-9 pr-3/);
  });

  it("closes the status dialog on Escape", () => {
    const dialogs = read("src/components/invoices/InvoiceStatusDialogs.tsx");
    expect(dialogs).toMatch(/event\.key !== "Escape"/);
    expect(dialogs).toMatch(/addEventListener\("keydown"/);
  });

  it("tints the cancel trigger on the issued invoice", () => {
    const detail = read("src/app/(dashboard)/invoices/[id]/page.tsx");
    expect(detail).toMatch(/btn-secondary text-error bg-red-50/);
  });
});
