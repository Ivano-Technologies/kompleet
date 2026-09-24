import { describe, expect, it } from "vitest";
import { toJsonSafe } from "./json";

describe("toJsonSafe", () => {
  it("returns a structured clone for JSON-safe values", () => {
    expect(toJsonSafe({ reports: [] }, { reports: ["fallback"] })).toEqual({
      reports: [],
    });
  });

  it("returns the fallback when the value cannot be serialized", () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(toJsonSafe(circular, { self: "fallback" })).toEqual({
      self: "fallback",
    });
  });
});
