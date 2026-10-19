import { describe, expect, it } from "vitest";
import {
  callbackLoginError,
  classifyAuthLinkError,
  loginPathForLinkError,
  paramsFromHash,
} from "./link-error";

const q = (s: string) => new URLSearchParams(s);

describe("classifyAuthLinkError", () => {
  it("returns null when there is no error", () => {
    expect(classifyAuthLinkError(q(""))).toBeNull();
    expect(classifyAuthLinkError(q("redirectTo=/dashboard"))).toBeNull();
  });

  it("maps expired or invalid link codes to expired_link", () => {
    for (const code of ["otp_expired", "flow_state_expired", "flow_state_not_found"]) {
      expect(classifyAuthLinkError(q(`error=access_denied&error_code=${code}`))).toBe(
        "expired_link",
      );
    }
    expect(classifyAuthLinkError(q("error=access_denied"))).toBe("expired_link");
    expect(
      classifyAuthLinkError(
        q("error=server_error&error_description=Email+link+is+invalid+or+has+expired"),
      ),
    ).toBe("expired_link");
  });

  it("maps other failures to auth_failed", () => {
    expect(classifyAuthLinkError(q("error=server_error&error_code=unexpected_failure"))).toBe(
      "auth_failed",
    );
    expect(classifyAuthLinkError(q("error=temporarily_unavailable"))).toBe("auth_failed");
  });

  it("reads the URL hash form", () => {
    expect(
      classifyAuthLinkError(
        paramsFromHash(
          "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
        ),
      ),
    ).toBe("expired_link");
    expect(classifyAuthLinkError(paramsFromHash("#access_token=abc"))).toBeNull();
  });
});

describe("callbackLoginError", () => {
  it("treats a leftover one time code or token as an expired link", () => {
    expect(callbackLoginError(q("code=abc123"))).toBe("expired_link");
    expect(callbackLoginError(q("token_hash=abc&type=recovery"))).toBe("expired_link");
  });

  it("returns null for a bare visit", () => {
    expect(callbackLoginError(q(""))).toBeNull();
  });

  it("builds the login path", () => {
    expect(loginPathForLinkError("expired_link")).toBe("/login?error=expired_link");
    expect(loginPathForLinkError("auth_failed")).toBe("/login?error=auth_failed");
  });
});
