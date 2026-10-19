import { describe, expect, it } from "vitest";
import { sourceDisplayName } from "./source-display-name";

describe("sourceDisplayName", () => {
  it("shows NRS for the stored FIRS source name", () => {
    expect(sourceDisplayName("Federal Inland Revenue Service (FIRS)")).toBe(
      "NRS (Nigeria Revenue Service)",
    );
  });

  it("leaves other source names unchanged", () => {
    expect(sourceDisplayName("EY Nigeria Tax Alerts")).toBe(
      "EY Nigeria Tax Alerts",
    );
  });

  it("handles missing names", () => {
    expect(sourceDisplayName(undefined)).toBe("");
  });
});
