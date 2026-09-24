import { describe, expect, it } from "vitest";
import { omitUndefined } from "./args";

describe("omitUndefined", () => {
  it("drops undefined keys and keeps defined values including null", () => {
    expect(
      omitUndefined({
        taxYear: undefined,
        status: "draft",
        reportType: undefined,
        empty: null,
      }),
    ).toEqual({ status: "draft", empty: null });
  });
});
