import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/nextjs";
import ForgotPasswordPage from "@/app/forgot-password/page";
import { FRIENDLY_MESSAGES } from "@/lib/friendly-error";

const signIn = vi.fn();

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/layout/AuthLayout", () => ({
  AuthLayout: ({
    children,
    headerLeftAddon,
  }: {
    children: ReactNode;
    headerLeftAddon?: ReactNode;
  }) => (
    <div>
      {headerLeftAddon}
      {children}
    </div>
  ),
}));

const RAW_SERVER_ERROR =
  "[Request ID: abc123] Server Error\nUncaught Error: InvalidAccountId";

async function submit(email: string) {
  const user = userEvent.setup();
  render(<ForgotPasswordPage />);
  await user.type(screen.getByLabelText("Email address"), email);
  await user.click(screen.getByRole("button", { name: "Send reset code" }));
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    signIn.mockReset();
    vi.mocked(Sentry.captureException).mockClear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("shows the neutral success screen when the account does not exist", async () => {
    signIn.mockRejectedValueOnce(new Error(RAW_SERVER_ERROR));
    await submit("nobody@example.com");

    expect(await screen.findByText("Check Your Email")).toBeInTheDocument();
    expect(screen.getByText("nobody@example.com")).toBeInTheDocument();
    expect(screen.queryByText(/Request ID/)).not.toBeInTheDocument();
    expect(screen.queryByText(/InvalidAccountId/)).not.toBeInTheDocument();
  });

  it("shows a generic message with a Ref for unexpected send failures", async () => {
    signIn.mockRejectedValueOnce("something odd");
    await submit("user@example.com");

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("error-ref")).toBeInTheDocument();
    expect(screen.queryByText("Check Your Email")).not.toBeInTheDocument();
  });

  it("shows the success screen when the request succeeds", async () => {
    signIn.mockResolvedValueOnce({ signingIn: false });
    await submit("user@example.com");

    expect(await screen.findByText("Check Your Email")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Enter reset code" }),
    ).toHaveAttribute("href", "/reset-password?email=user%40example.com");
  });

  it("shows a friendly inline error for network failures", async () => {
    signIn.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await submit("user@example.com");

    expect(
      await screen.findByText(
        "We couldn't send the code. Check your connection and try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Check Your Email")).not.toBeInTheDocument();
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument();
  });

  it("trims and lowercases the email before calling signIn", async () => {
    signIn.mockResolvedValueOnce({ signingIn: false });
    await submit("  Jane.Doe@Example.COM  ");

    expect(signIn).toHaveBeenCalledWith("password", {
      email: "jane.doe@example.com",
      flow: "reset",
    });
    expect(await screen.findByText("jane.doe@example.com")).toBeInTheDocument();
  });

  it("says the reset code lasts 60 minutes", () => {
    render(<ForgotPasswordPage />);
    expect(
      screen.getByText(/The code expires in 60 minutes\./),
    ).toBeInTheDocument();
  });

  it("uses sentence-case reset copy, the shared back link, and the verify-sized expiry line", () => {
    render(<ForgotPasswordPage />);
    expect(
      screen.getByText(
        "Enter your email to get an 8-digit code to reset your password.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send reset code" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to login" })).toHaveAttribute(
      "href",
      "/login",
    );
    const expiry = screen.getByText(/The code expires in 60 minutes\./);
    expect(expiry.className).toMatch(/text-sm/);
    expect(expiry.className).not.toMatch(/text-xs/);
  });

  it("shows a wait message when sending is rate limited", async () => {
    signIn.mockRejectedValueOnce(new Error("Too many attempts"));
    await submit("user@example.com");
    expect(
      await screen.findByText("Too many attempts. Please wait a moment and try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Check Your Email")).not.toBeInTheDocument();
  });

  it("shows the generic message without a Ref for a redacted Server Error", async () => {
    signIn.mockRejectedValueOnce(new Error("[Request ID: abc] Server Error"));
    await submit("user@example.com");
    expect(
      await screen.findByText(FRIENDLY_MESSAGES.fallback),
    ).toBeInTheDocument();
    expect(screen.queryByText("Check Your Email")).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
