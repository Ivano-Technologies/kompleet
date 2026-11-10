import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VerifyEmailClient from "./VerifyEmailClient";
import { AUTH_ERROR_CODES } from "../../../convex/lib/authErrors";
import { FRIENDLY_MESSAGES } from "@/lib/friendly-error";
import * as Sentry from "@sentry/nextjs";

class FakeConvexError extends Error {
  data: unknown;
  constructor(data: unknown) {
    super("ConvexError");
    this.name = "ConvexError";
    this.data = data;
  }
}

const signIn = vi.fn();
const push = vi.fn();
const refresh = vi.fn();

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams("email=Jane@Example.com"),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/components/layout/AuthLayout", () => ({
  AuthLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("VerifyEmailClient", () => {
  beforeEach(() => {
    signIn.mockReset();
    push.mockReset();
    refresh.mockReset();
    vi.mocked(Sentry.captureException).mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("shows sentence case copy, expiry and resend, without the reclaim note", () => {
    render(<VerifyEmailClient />);
    expect(screen.getByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText(/expires in 15 minutes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify email" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Resend code" })).toBeInTheDocument();
    expect(screen.queryByText(/Already used Kompleet/)).not.toBeInTheDocument();
    expect(screen.queryByText(/—|–/)).not.toBeInTheDocument();
  });

  it("strips punctuation on paste and enables Verify at 8 digits", async () => {
    render(<VerifyEmailClient />);
    const input = screen.getByLabelText("Verification code");
    const paste = createEvent.paste(input, {
      clipboardData: { getData: () => "85118942." },
    });
    fireEvent(input, paste);
    expect(input).toHaveValue("85118942");
    expect(screen.getByRole("button", { name: "Verify email" })).toBeEnabled();
  });

  it("submits the email verification flow and continues to the dashboard", async () => {
    signIn.mockResolvedValueOnce({ signingIn: true });
    const user = userEvent.setup();
    render(<VerifyEmailClient />);
    await user.type(screen.getByLabelText("Verification code"), "12345678");
    await user.click(screen.getByRole("button", { name: "Verify email" }));
    expect(signIn).toHaveBeenCalledWith(
      "password",
      expect.objectContaining({
        email: "jane@example.com",
        code: "12345678",
        flow: "email-verification",
      }),
    );
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("treats a missing account on resend like a sent code", async () => {
    signIn.mockRejectedValueOnce(new Error("InvalidAccountId"));
    const user = userEvent.setup();
    render(<VerifyEmailClient />);
    await user.click(screen.getByRole("button", { name: "Resend code" }));
    expect(await screen.findByRole("button", { name: /Resend code in \d+s/ })).toBeInTheDocument();
    expect(
      screen.queryByText(/doesn't match|invalid or expired/i),
    ).not.toBeInTheDocument();
  });

  it("treats a typed INVALID_CREDENTIALS ConvexError on resend like a sent code", async () => {
    signIn.mockRejectedValueOnce(
      new FakeConvexError({ code: AUTH_ERROR_CODES.INVALID_CREDENTIALS }),
    );
    const user = userEvent.setup();
    render(<VerifyEmailClient />);
    await user.click(screen.getByRole("button", { name: "Resend code" }));
    expect(await screen.findByRole("button", { name: /Resend code in \d+s/ })).toBeInTheDocument();
    expect(screen.queryByText(FRIENDLY_MESSAGES.invalidCredentials)).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
  });

  it("maps an invalid code to friendly text without Sentry or a Ref", async () => {
    signIn.mockRejectedValueOnce(
      new Error("[Request ID: abc] Server Error\nUncaught Error: Invalid code"),
    );
    const user = userEvent.setup();
    render(<VerifyEmailClient />);
    await user.type(screen.getByLabelText("Verification code"), "00000000");
    await user.click(screen.getByRole("button", { name: "Verify email" }));
    expect(
      await screen.findByText(FRIENDLY_MESSAGES.invalidCode),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("maps a redacted Server Error from verify to the invalid-or-expired message", async () => {
    signIn.mockRejectedValueOnce(new Error("[Request ID: abc] Server Error"));
    const user = userEvent.setup();
    render(<VerifyEmailClient />);
    await user.type(screen.getByLabelText("Verification code"), "00000000");
    await user.click(screen.getByRole("button", { name: "Verify email" }));
    expect(
      await screen.findByText(FRIENDLY_MESSAGES.invalidCode),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
