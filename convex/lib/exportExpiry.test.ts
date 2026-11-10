/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
  EXPORT_LINK_TTL_MS,
  exportExpiresAt,
  exportExpiresAtIso,
} from "./exportExpiry";

describe("export expiry", () => {
  it("stores created + 7 days when no expiry was saved", () => {
    const createdAt = Date.UTC(2026, 10, 10, 16, 41, 0);
    expect(exportExpiresAt(createdAt)).toBe(createdAt + EXPORT_LINK_TTL_MS);
    expect(EXPORT_LINK_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("keeps a real stored expiry and ignores epoch / missing values", () => {
    const createdAt = Date.UTC(2026, 10, 10, 16, 41, 0);
    const stored = createdAt + EXPORT_LINK_TTL_MS;
    expect(exportExpiresAt(createdAt, stored)).toBe(stored);
    expect(exportExpiresAt(createdAt, 0)).toBe(createdAt + EXPORT_LINK_TTL_MS);
    expect(exportExpiresAt(createdAt, null)).toBe(createdAt + EXPORT_LINK_TTL_MS);
    expect(exportExpiresAtIso(createdAt, undefined)).toBe(
      new Date(createdAt + EXPORT_LINK_TTL_MS).toISOString(),
    );
  });
});
