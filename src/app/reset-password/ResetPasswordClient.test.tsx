import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResetPasswordClient from "@/app/reset-password/ResetPasswordClient";

const signIn = vi.fn();

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
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

async function submit() {
  const user = userEvent.setup();
  render(<ResetPasswordClient />);
  await user.type(screen.getByLabelText("Reset code"), "12345678");
  await user.type(screen.getByLabelText("New Password"), "secret123");
  await user.type(screen.getByLabelText("Confirm Password"), "secret123");
  await user.click(screen.getByRole("button", { name: "Update Password" }));
}

describe("ResetPasswordClient", () => {
  beforeEach(() => {
    signIn.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("maps an invalid code to friendly text", async () => {
    signIn.mockRejectedValueOnce(
      new Error("[Request ID: abc] Server Error\nUncaught Error: Invalid code"),
    );
    await submit();
    expect(
      await screen.findByText(
        "This code is invalid or has expired. Request a new one.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Request ID/)).not.toBeInTheDocument();
  });

  it("maps an unknown account to the invalid code message", async () => {
    signIn.mockRejectedValueOnce(new Error("InvalidAccountId"));
    await submit();
    expect(
      await screen.findByText(
        "This code is invalid or has expired. Request a new one.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a generic message for anything else", async () => {
    signIn.mockRejectedValueOnce(new Error("[Request ID: abc] Server Error"));
    await submit();
    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
  });

  it("normalises the email", async () => {
    signIn.mockRejectedValueOnce(new Error("x"));
    await submit();
    expect(signIn).toHaveBeenCalledWith(
      "password",
      expect.objectContaining({ email: "jane@example.com", code: "12345678" }),
    );
  });
});
