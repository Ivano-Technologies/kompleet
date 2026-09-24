import { describe, expect, it } from "vitest";
import { rethrowIfNextControlFlow } from "./next-control-flow";

describe("rethrowIfNextControlFlow", () => {
  it("rethrows Next.js dynamic-server usage errors", () => {
    const error = Object.assign(new Error("Dynamic server usage: cookies"), {
      digest: "DYNAMIC_SERVER_USAGE",
    });
    expect(() => rethrowIfNextControlFlow(error)).toThrow(error);
  });

  it("leaves ordinary errors alone so callers can map them", () => {
    expect(() =>
      rethrowIfNextControlFlow(new Error("Table taxReports not found")),
    ).not.toThrow();
  });
});
