import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/nextjs";
import { AUTH_ERROR_CODES } from "../../convex/lib/authErrors";
import {
  FRIENDLY_FALLBACK,
  FRIENDLY_MESSAGES,
  UserFacingError,
  apiErrorMessage,
  isNetworkError,
  isRedactedConvexServerError,
  normalizeEmail,
  rateLimitedMessage,
  responseError,
  stripErrorWrappers,
  toFriendlyMessage,
  toFriendlyError,
  generateRef,
  splitRef,
  withRef,
  friendlyErrorBody,
  userFacingError,
} from "@/lib/friendly-error";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

const convexWrap = (inner: string) =>
  `[CONVEX A(auth:signIn)] [Request ID: 7f3a9c1e2b] Server Error\nUncaught Error: ${inner}\n    at handler (../convex/auth.ts:42:11)\n\n  Called by client`;

class FakeConvexError extends Error {
  data: unknown;
  constructor(data: unknown) {
    super(typeof data === "string" ? data : "ConvexError");
    this.name = "ConvexError";
    this.data = data;
  }
}

const msg = (...args: Parameters<typeof toFriendlyError>) =>
  toFriendlyError(...args).message;

describe("friendly-error", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(Sentry.captureException).mockClear();
  });
  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  describe("stripErrorWrappers", () => {
    it("removes Convex request ID wrappers and stack lines", () => {
      expect(stripErrorWrappers(convexWrap("Client name is required"))).toBe(
        "Client name is required",
      );
    });
  });

  describe("toFriendlyMessage", () => {
    it("never returns raw Convex server errors", () => {
      const out = msg(new Error("[Request ID: abc123] Server Error"));
      expect(out).toBe(FRIENDLY_FALLBACK);
      expect(out).not.toMatch(/Request ID|Server Error/);
    });

    it("uses the caller's fallback for unknown errors", () => {
      expect(
        msg(
          new Error("column foo does not exist"),
          "We couldn't load your invoices.",
        ),
      ).toBe("We couldn't load your invoices.");
      expect(msg({ weird: true })).toBe(FRIENDLY_FALLBACK);
      expect(msg(undefined)).toBe(FRIENDLY_FALLBACK);
    });

    it("maps unknown account and wrong password to one message", () => {
      expect(msg(new Error(convexWrap("InvalidAccountId")))).toBe(
        FRIENDLY_MESSAGES.invalidCredentials,
      );
      expect(msg(new Error(convexWrap("InvalidSecret")))).toBe(
        FRIENDLY_MESSAGES.invalidCredentials,
      );

    });

    it("maps an existing account", () => {
      expect(
        msg(
          new Error(convexWrap("Account jane@example.com already exists")),
        ),
      ).toBe(
        "An account with this email already exists. Try signing in or reset your password.",
      );
    });

    it("keeps our own password rule text", () => {
      expect(
        msg(
          new Error(convexWrap("Password must contain at least one number")),
        ),
      ).toBe("Password must contain at least one number.");
    });

    it("maps invalid or expired codes", () => {
      expect(msg(new Error(convexWrap("Invalid code")))).toBe(
        FRIENDLY_MESSAGES.invalidCode,
      );
      expect(msg(new Error("Could not verify code"))).toBe(
        FRIENDLY_MESSAGES.invalidCode,
      );
    });

    it("maps typed ConvexError auth codes, including wait time", () => {
      expect(
        msg(new FakeConvexError({ code: AUTH_ERROR_CODES.INVALID_CODE })),
      ).toBe(FRIENDLY_MESSAGES.invalidCode);
      expect(
        msg(new FakeConvexError({ code: AUTH_ERROR_CODES.EXPIRED_CODE })),
      ).toBe(FRIENDLY_MESSAGES.invalidCode);
      expect(
        msg(new FakeConvexError({ code: AUTH_ERROR_CODES.ACCOUNT_EXISTS })),
      ).toBe(FRIENDLY_MESSAGES.accountExists);
      expect(
        msg(new FakeConvexError({ code: AUTH_ERROR_CODES.INVALID_CREDENTIALS })),
      ).toBe(FRIENDLY_MESSAGES.invalidCredentials);
      expect(
        msg(
          new FakeConvexError({
            code: AUTH_ERROR_CODES.RATE_LIMITED,
            retryAfterSeconds: 47,
          }),
        ),
      ).toBe("Too many attempts. Please wait 47 seconds and try again.");
      expect(
        msg(
          new FakeConvexError({
            code: AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS,
            retryAfterSeconds: 3600,
          }),
        ),
      ).toBe("Too many attempts. Please wait an hour and try again.");
    });

    it("maps a redacted Server Error to the caller fallback on verify/reset", () => {
      const err = new Error("[Request ID: abc] Server Error");
      expect(isRedactedConvexServerError(err)).toBe(true);
      expect(
        msg(err, FRIENDLY_FALLBACK, {
          redactedFallback: FRIENDLY_MESSAGES.invalidCode,
        }),
      ).toBe(FRIENDLY_MESSAGES.invalidCode);
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it("does not report expected auth errors to Sentry", () => {
      const result = toFriendlyError(new Error("Could not verify code"));
      expect(result.known).toBe(true);
      expect(result.message).toBe(FRIENDLY_MESSAGES.invalidCode);
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it("reports unexpected errors to Sentry", () => {
      const err = new Error("[Request ID: abc] Server Error");
      const result = toFriendlyError(err);
      expect(result.known).toBe(false);
      expect(result.message).toBe(FRIENDLY_FALLBACK);
      expect(Sentry.captureException).toHaveBeenCalledWith(
        err,
        expect.anything(),
      );
    });

    it("maps an unverified account", () => {
      expect(msg(new Error("Email not verified"))).toBe(
        FRIENDLY_MESSAGES.unverified,
      );
    });

    it("formats rate-limit wait copy", () => {
      expect(rateLimitedMessage(null)).toBe(FRIENDLY_MESSAGES.rateLimited);
      expect(rateLimitedMessage(1)).toBe(
        "Too many attempts. Please wait 1 second and try again.",
      );
      expect(rateLimitedMessage(90)).toBe(
        "Too many attempts. Please wait 2 minutes and try again.",
      );
    });

    it("maps network and offline errors", () => {
      expect(msg(new TypeError("Failed to fetch"))).toBe(
        FRIENDLY_MESSAGES.network,
      );
      expect(msg(new Error("fetch failed"))).toBe(
        FRIENDLY_MESSAGES.network,
      );
    });

    it("maps rate limits", () => {
      expect(msg(new Error("Rate limit exceeded"))).toBe(
        FRIENDLY_MESSAGES.rateLimited,
      );
      expect(
        msg(new Error(convexWrap("TooManyFailedAttempts"))),
      ).toBe(FRIENDLY_MESSAGES.rateLimited);
    });

    it("passes through deliberate user-facing errors", () => {
      expect(
        msg(new UserFacingError("Pick a tax year first.")),
      ).toBe("Pick a tax year first.");
      expect(
        msg(new FakeConvexError("Invoice already paid.")),
      ).toBe("Invoice already paid.");
      expect(
        msg(new FakeConvexError({ message: "Pick a client." })),
      ).toBe("Pick a client.");
    });

    it("maps allowlisted validation messages from our Convex functions", () => {
      expect(
        msg(
          new Error(convexWrap("Select a client before issuing")),
        ),
      ).toBe("Select a client before issuing.");
      expect(
        msg(new Error(convexWrap("Invoice not found"))),
      ).toBe("We couldn't find this invoice.");
    });

    it("passes IVA-190 invoice amount ConvexError copy through and maps wrapped Errors", () => {
      expect(
        msg(new FakeConvexError("Line item 1: Quantity can't be negative.")),
      ).toBe("Line item 1: Quantity can't be negative.");
      expect(
        msg(new Error(convexWrap("Line item 2: Unit price can't be negative."))),
      ).toBe("Unit price can't be negative.");
      expect(
        msg(new Error(convexWrap("Line item 1: Discount can't be more than the line total."))),
      ).toBe("Discount can't be more than the line total.");
      expect(msg(new FakeConvexError("VAT rate must be between 0% and 100%."))).toBe(
        "VAT rate must be between 0% and 100%.",
      );
      expect(msg(new Error(convexWrap("Enter a number for quantity.")))).toBe(
        "Enter a number for quantity.",
      );
      expect(msg(new FakeConvexError("This invoice has already been issued."))).toBe(
        "This invoice has already been issued.",
      );
      expect(
        msg(new FakeConvexError("Add at least one item before issuing this invoice.")),
      ).toBe("Add at least one item before issuing this invoice.");
      expect(
        msg(new FakeConvexError("This update can't change the invoice status.")),
      ).toBe("This update can't change the invoice status.");
      expect(
        msg(new FakeConvexError("This invoice number is already used.")),
      ).toBe("This invoice number is already used.");
      expect(
        msg(new FakeConvexError("Only issued invoices can be marked paid.")),
      ).toBe("Only issued invoices can be marked paid.");
      expect(
        msg(
          new FakeConvexError({
            code: "FORBIDDEN",
            message: "You can't change this invoice.",
          }),
        ),
      ).toBe("You can't change this invoice.");
    });

    it("maps missing tax rules without leaking rule keys", () => {
      const err = new Error(
        'Missing tax rule "vat.standard_rate". Refusing to fall back',
      );
      err.name = "MissingTaxRuleError";
      const out = msg(err);
      expect(out).toBe(FRIENDLY_MESSAGES.missingTaxRule);
      expect(out).not.toContain("vat.standard_rate");
    });

    it("logs the raw error with the same 8 character ref", () => {
      const err = new Error("boom");
      const { ref } = toFriendlyError(err);
      expect(ref).toMatch(/^[A-Z0-9]{8}$/);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`[friendly-error] ref=${ref}`),
        err,
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it("reuses the ref an API route already issued", () => {
      const { ref } = toFriendlyError(
        userFacingError({ error: "Pick a client.", ref: "ABCD2345" }),
      );
      expect(ref).toBe("ABCD2345");
    });

    it("toFriendlyMessage appends a ref that splitRef reads back", () => {
      const text = toFriendlyMessage(new Error("[Request ID: x] Server Error"));
      const { message, ref } = splitRef(text);
      expect(message).toBe(FRIENDLY_FALLBACK);
      expect(ref).toMatch(/^[A-Z0-9]{8}$/);
      expect(splitRef(withRef("Hi.", "ZZZZ2222"))).toEqual({
        message: "Hi.",
        ref: "ZZZZ2222",
      });
      expect(generateRef()).toMatch(/^[A-Z0-9]{8}$/);
    });

    it("friendlyErrorBody returns { error, ref } for API routes", () => {
      const body = friendlyErrorBody(new Error("column x does not exist"));
      expect(body.error).toBe(FRIENDLY_FALLBACK);
      expect(body.ref).toMatch(/^[A-Z0-9]{8}$/);
    });

    it("uses the exact login mismatch copy", () => {
      expect(FRIENDLY_MESSAGES.invalidCredentials).toBe(
        "That email or password doesn't match. Check and try again.",
      );
    });

    it("never produces em dashes", () => {
      for (const m of Object.values(FRIENDLY_MESSAGES)) {
        expect(m).not.toMatch(/[\u2013\u2014]| - /);
      }
    });
  });

  describe("API helpers", () => {
    it("userFacingError rejects raw-looking API text", () => {
      expect(userFacingError("Client saved badly.", "fb").message).toBe(
        "Client saved badly.",
      );
      expect(
        userFacingError("[Request ID: x] Server Error", "fb").message,
      ).toBe("fb");
      expect(userFacingError("TypeError: x is undefined", "fb").message).toBe(
        "fb",
      );
      expect(splitRef(apiErrorMessage(undefined, "fb")).message).toBe("fb");
    });

    it("responseError reads JSON errors and maps 429", async () => {
      const ok = await responseError(
        new Response(JSON.stringify({ error: "Pick a client." }), {
          status: 400,
        }),
      );
      expect(ok.message).toBe("Pick a client.");
      const limited = await responseError(new Response("{}", { status: 429 }));
      expect(limited.message).toBe(FRIENDLY_MESSAGES.rateLimited);
    });
  });

  it("normalizeEmail and isNetworkError", () => {
    expect(normalizeEmail("  A@B.COM ")).toBe("a@b.com");
    expect(isNetworkError(new Error("InvalidAccountId"))).toBe(false);
    expect(isNetworkError(new TypeError("Load failed"))).toBe(true);
  });
});
