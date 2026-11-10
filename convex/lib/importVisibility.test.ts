import { describe, expect, it } from "vitest";
import {
  IMPORT_ORPHAN_POLICY,
  isImportLedgerVisible,
  ledgerRowsForDisplay,
} from "./importVisibility";

describe("import ledger visibility", () => {
  it("treats a missing session stamp as visible (no backfill)", () => {
    const completed = new Set<string>(["sess-done"]);
    expect(isImportLedgerVisible({}, completed)).toBe(true);
    expect(
      isImportLedgerVisible({ importSessionExternalId: undefined }, completed),
    ).toBe(true);
  });

  it("hides rows until their session is completed", () => {
    const completed = new Set<string>(["sess-done"]);
    expect(
      isImportLedgerVisible({ importSessionExternalId: "sess-done" }, completed),
    ).toBe(true);
    expect(
      isImportLedgerVisible(
        { importSessionExternalId: "sess-processing" },
        completed,
      ),
    ).toBe(false);
  });

  it("keeps orphaned processing/failed sessions hidden", () => {
    expect(IMPORT_ORPHAN_POLICY).toBe("stay-hidden");
    const completed = new Set<string>();
    const rows = [
      { id: "legacy" },
      { id: "mid", importSessionExternalId: "sess-killed" },
      { id: "done", importSessionExternalId: "sess-done" },
    ];
    expect(ledgerRowsForDisplay(rows, completed).map((r) => r.id)).toEqual([
      "legacy",
    ]);
    expect(
      ledgerRowsForDisplay(rows, new Set(["sess-done"])).map((r) => r.id),
    ).toEqual(["legacy", "done"]);
  });
});
