import { describe, expect, it } from "vitest";
import {
  isConvexArgumentExtraField,
  isConvexAuthError,
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
});
