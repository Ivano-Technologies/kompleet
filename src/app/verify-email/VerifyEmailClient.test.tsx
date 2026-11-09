import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VerifyEmailClient from "./VerifyEmailClient";
import { RECLAIM_SIGNUP_NOTE } from "@/lib/auth/copy";

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
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("shows sentence case copy, expiry, resend and the reclaim note", () => {
    render(<VerifyEmailClient />);
    expect(screen.getByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText(/expires in 15 minutes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify email" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend code" })).toBeInTheDocument();
    expect(screen.getByTestId("reclaim-note").textContent).toBe(RECLAIM_SIGNUP_NOTE);
    expect(screen.queryByText(/—|–/)).not.toBeInTheDocument();
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

  it("maps an invalid code to friendly text", async () => {
    signIn.mockRejectedValueOnce(
      new Error("[Request ID: abc] Server Error\nUncaught Error: Invalid code"),
    );
    const user = userEvent.setup();
    render(<VerifyEmailClient />);
    await user.type(screen.getByLabelText("Verification code"), "00000000");
    await user.click(screen.getByRole("button", { name: "Verify email" }));
    expect(
      await screen.findByText("This code is invalid or has expired. Request a new one."),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
