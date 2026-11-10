/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import { displayPersonName, joinPersonName } from "./names";

describe("person names", () => {
  it("joins first and last name and keeps a single given name working", () => {
    expect(joinPersonName("Audit", "Test")).toBe("Audit Test");
    expect(joinPersonName("Audit", "")).toBe("Audit");
    expect(joinPersonName("  Ada  ", "  Okonkwo  ")).toBe("Ada Okonkwo");
  });

  it("prefers stored full name, then first+last, then email", () => {
    expect(
      displayPersonName({
        fullName: "Audit Test",
        firstName: "Audit",
        lastName: "Test",
        email: "ada@example.com",
      }),
    ).toBe("Audit Test");
    expect(
      displayPersonName({
        firstName: "Audit",
        lastName: "Test",
        email: "ada@example.com",
      }),
    ).toBe("Audit Test");
    expect(displayPersonName({ email: "ada@example.com" })).toBe(
      "ada@example.com",
    );
  });
});
