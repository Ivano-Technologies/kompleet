import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthLinkErrorRedirect } from "./AuthLinkErrorRedirect";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("AuthLinkErrorRedirect", () => {
  beforeEach(() => replace.mockReset());
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("sends an expired link hash to /login?error=expired_link", () => {
    window.history.replaceState(
      null,
      "",
      "/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    );
    render(<AuthLinkErrorRedirect />);
    expect(replace).toHaveBeenCalledWith("/login?error=expired_link");
  });

  it("sends other hash errors to /login?error=auth_failed", () => {
    window.history.replaceState(null, "", "/#error=server_error&error_code=unexpected_failure");
    render(<AuthLinkErrorRedirect />);
    expect(replace).toHaveBeenCalledWith("/login?error=auth_failed");
  });

  it("ignores normal anchors", () => {
    window.history.replaceState(null, "", "/#pricing");
    render(<AuthLinkErrorRedirect />);
    expect(replace).not.toHaveBeenCalled();
  });
});
