import { describe, expect, it } from "vitest";
import {
  isConvexArgumentExtraField,
  isConvexAuthError,
  isConvexForbiddenError,
  isConvexFunctionMissing,
} from "./errors";

describe("convex error matchers", () => {
  it("detects a missing public function", () => {
    expect(
      isConvexFunctionMissing(
        new Error(
          "Could not find public function for 'documents:getMineByIdempotencyKey'.",
        ),
      ),
    ).toBe(true);
    expect(isConvexFunctionMissing(new Error("User not found"))).toBe(false);
  });

  it("detects extra-field ArgumentValidationError", () => {
    expect(
      isConvexArgumentExtraField(
        new Error(
          "ArgumentValidationError: Object contains extra field `documentType` that is not in the validator.",
        ),
      ),
    ).toBe(true);
    expect(
      isConvexArgumentExtraField(new Error("ArgumentValidationError: Missing field")),
    ).toBe(false);
  });

  it("detects Convex auth failures", () => {
    expect(isConvexAuthError(new Error("Not authenticated"))).toBe(true);
    expect(isConvexAuthError(new Error("User not found"))).toBe(false);
  });

  it("detects FORBIDDEN without treating it as a missing function", () => {
    expect(isConvexForbiddenError(new Error("FORBIDDEN"))).toBe(true);
    expect(
      isConvexForbiddenError(
        Object.assign(new Error("[CONVEX Q(users:listAll)] FORBIDDEN"), {
          data: "FORBIDDEN",
        }),
      ),
    ).toBe(true);
    expect(isConvexForbiddenError(new Error("Not authenticated"))).toBe(false);
    expect(isConvexFunctionMissing(new Error("FORBIDDEN"))).toBe(false);
  });
});
