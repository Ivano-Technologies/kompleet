import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FRIENDLY_FALLBACK,
  FRIENDLY_MESSAGES,
  UserFacingError,
  apiErrorMessage,
  isNetworkError,
  normalizeEmail,
  responseError,
  stripErrorWrappers,
  toFriendlyMessage,
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

describe("friendly-error", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    errorSpy.mockRestore();
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
      const msg = toFriendlyMessage(
        new Error("[Request ID: abc123] Server Error"),
      );
      expect(msg).toBe(FRIENDLY_FALLBACK);
      expect(msg).not.toMatch(/Request ID|Server Error/);
    });

    it("uses the caller's fallback for unknown errors", () => {
      expect(
        toFriendlyMessage(
          new Error("column foo does not exist"),
          "We couldn't load your invoices.",
        ),
      ).toBe("We couldn't load your invoices.");
      expect(toFriendlyMessage({ weird: true })).toBe(FRIENDLY_FALLBACK);
      expect(toFriendlyMessage(undefined)).toBe(FRIENDLY_FALLBACK);
    });

    it("maps unknown account and wrong password to one message", () => {
      expect(toFriendlyMessage(new Error(convexWrap("InvalidAccountId")))).toBe(
        FRIENDLY_MESSAGES.invalidCredentials,
      );
      expect(toFriendlyMessage(new Error(convexWrap("InvalidSecret")))).toBe(
        FRIENDLY_MESSAGES.invalidCredentials,
      );
      expect(FRIENDLY_MESSAGES.invalidCredentials).toBe(
        "Email or password is incorrect.",
      );
    });

    it("maps an existing account", () => {
      expect(
        toFriendlyMessage(
          new Error(convexWrap("Account jane@example.com already exists")),
        ),
      ).toBe(
        "An account with this email already exists. Try signing in or reset your password.",
      );
    });

    it("keeps our own password rule text", () => {
      expect(
        toFriendlyMessage(
          new Error(convexWrap("Password must contain at least one number")),
        ),
      ).toBe("Password must contain at least one number.");
    });

    it("maps invalid or expired codes", () => {
      expect(toFriendlyMessage(new Error(convexWrap("Invalid code")))).toBe(
        FRIENDLY_MESSAGES.invalidCode,
      );
      expect(toFriendlyMessage(new Error("Could not verify code"))).toBe(
        FRIENDLY_MESSAGES.invalidCode,
      );
    });

    it("maps network and offline errors", () => {
      expect(toFriendlyMessage(new TypeError("Failed to fetch"))).toBe(
        FRIENDLY_MESSAGES.network,
      );
      expect(toFriendlyMessage(new Error("fetch failed"))).toBe(
        FRIENDLY_MESSAGES.network,
      );
    });

    it("maps rate limits", () => {
      expect(toFriendlyMessage(new Error("Rate limit exceeded"))).toBe(
        FRIENDLY_MESSAGES.rateLimited,
      );
      expect(
        toFriendlyMessage(new Error(convexWrap("TooManyFailedAttempts"))),
      ).toBe(FRIENDLY_MESSAGES.rateLimited);
    });

    it("passes through deliberate user-facing errors", () => {
      expect(
        toFriendlyMessage(new UserFacingError("Pick a tax year first.")),
      ).toBe("Pick a tax year first.");
      expect(
        toFriendlyMessage(new FakeConvexError("Invoice already paid.")),
      ).toBe("Invoice already paid.");
      expect(
        toFriendlyMessage(new FakeConvexError({ message: "Pick a client." })),
      ).toBe("Pick a client.");
    });

    it("maps allowlisted validation messages from our Convex functions", () => {
      expect(
        toFriendlyMessage(
          new Error(convexWrap("Select a client before issuing")),
        ),
      ).toBe("Select a client before issuing.");
      expect(
        toFriendlyMessage(new Error(convexWrap("Invoice not found"))),
      ).toBe("We couldn't find this invoice.");
    });

    it("maps missing tax rules without leaking rule keys", () => {
      const err = new Error(
        'Missing tax rule "vat.standard_rate". Refusing to fall back',
      );
      err.name = "MissingTaxRuleError";
      const msg = toFriendlyMessage(err);
      expect(msg).toBe(FRIENDLY_MESSAGES.missingTaxRule);
      expect(msg).not.toContain("vat.standard_rate");
    });

    it("logs the raw error", () => {
      const err = new Error("boom");
      toFriendlyMessage(err);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[friendly-error]"),
        err,
      );
    });

    it("never produces em dashes", () => {
      for (const m of Object.values(FRIENDLY_MESSAGES)) {
        expect(m).not.toContain("\u2014");
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
      expect(apiErrorMessage(undefined, "fb")).toBe("fb");
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
