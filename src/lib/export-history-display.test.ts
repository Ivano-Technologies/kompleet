/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
  formatExportExpiry,
  shouldShowExportEmptyState,
} from "./export-history-display";

describe("export history display", () => {
  it("formats a real expiry and never shows the Unix epoch", () => {
    const created = "2026-11-10T16:41:00.000Z";
    const expires = "2026-11-17T16:41:00.000Z";
    const iso = (date: Date) => date.toISOString();
    expect(formatExportExpiry(expires, created, iso)).toBe(expires);
    expect(formatExportExpiry(null, created, iso)).toBe(
      "2026-11-17T16:41:00.000Z",
    );
    expect(formatExportExpiry("1970-01-01T00:00:00.000Z", created, iso)).toBe(
      "2026-11-17T16:41:00.000Z",
    );
    expect(formatExportExpiry("1970-01-01T01:00:00.000Z", created, iso)).toBe(
      "2026-11-17T16:41:00.000Z",
    );
  });

  it("hides the empty state while loading or when rows exist", () => {
    expect(shouldShowExportEmptyState(true, 0)).toBe(false);
    expect(shouldShowExportEmptyState(false, 1)).toBe(false);
    expect(shouldShowExportEmptyState(false, 0)).toBe(true);
  });
});
