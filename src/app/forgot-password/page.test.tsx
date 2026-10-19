import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ForgotPasswordPage from "@/app/forgot-password/page";

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
  AuthLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const RAW_SERVER_ERROR =
  "[Request ID: abc123] Server Error\nUncaught Error: InvalidAccountId";

async function submit(email: string) {
  const user = userEvent.setup();
  render(<ForgotPasswordPage />);
  await user.type(screen.getByLabelText("Email address"), email);
  await user.click(screen.getByRole("button", { name: "Send Reset Code" }));
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    signIn.mockReset();
  });

  it("shows the neutral success screen when the account does not exist", async () => {
    signIn.mockRejectedValueOnce(new Error(RAW_SERVER_ERROR));
    await submit("nobody@example.com");

    expect(await screen.findByText("Check Your Email")).toBeInTheDocument();
    expect(screen.getByText("nobody@example.com")).toBeInTheDocument();
    expect(screen.queryByText(/Request ID/)).not.toBeInTheDocument();
    expect(screen.queryByText(/InvalidAccountId/)).not.toBeInTheDocument();
  });

  it("shows the neutral success screen for unknown errors", async () => {
    signIn.mockRejectedValueOnce("something odd");
    await submit("user@example.com");

    expect(await screen.findByText("Check Your Email")).toBeInTheDocument();
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

  it("keeps the footer note unchanged", () => {
    render(<ForgotPasswordPage />);
    expect(
      screen.getByText(
        /Existing users can also reclaim by signing up with the same email\./,
      ),
    ).toBeInTheDocument();
  });
});
