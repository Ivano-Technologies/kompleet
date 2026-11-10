import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResetPasswordClient from "@/app/reset-password/ResetPasswordClient";
import { FRIENDLY_MESSAGES } from "@/lib/friendly-error";
import * as Sentry from "@sentry/nextjs";

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

async function submit() {
  const user = userEvent.setup();
  render(<ResetPasswordClient />);
  await user.type(screen.getByLabelText("Reset code"), "12345678");
  await user.type(screen.getByLabelText("New Password"), "secret123");
  await user.type(screen.getByLabelText("Confirm Password"), "secret123");
  await user.click(screen.getByRole("button", { name: "Update password" }));
}

describe("ResetPasswordClient", () => {
  beforeEach(() => {
    signIn.mockReset();
    vi.mocked(Sentry.captureException).mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("uses the shared back link and sentence-case update CTA", () => {
    render(<ResetPasswordClient />);
    expect(
      screen.getByRole("heading", { name: "Set a new password" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to login" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("button", { name: "Update password" })).toBeDisabled();
  });

  it("strips punctuation on paste", () => {
    render(<ResetPasswordClient />);
    const input = screen.getByLabelText("Reset code");
    const paste = createEvent.paste(input, {
      clipboardData: { getData: () => "85118942." },
    });
    fireEvent(input, paste);
    expect(input).toHaveValue("85118942");
  });

  it("maps an invalid code to friendly text", async () => {
    signIn.mockRejectedValueOnce(
      new Error("[Request ID: abc] Server Error\nUncaught Error: Invalid code"),
    );
    await submit();
    expect(
      await screen.findByText(FRIENDLY_MESSAGES.invalidCode),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Request ID/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("maps an unknown account to the invalid code message", async () => {
    signIn.mockRejectedValueOnce(new Error("InvalidAccountId"));
    await submit();
    expect(
      await screen.findByText(FRIENDLY_MESSAGES.invalidCode),
    ).toBeInTheDocument();
  });

  it("maps a redacted Server Error to the generic message without a Ref", async () => {
    signIn.mockRejectedValueOnce(new Error("[Request ID: abc] Server Error"));
    await submit();
    expect(
      await screen.findByText(FRIENDLY_MESSAGES.fallback),
    ).toBeInTheDocument();
    expect(screen.queryByText(FRIENDLY_MESSAGES.invalidCode)).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
    expect(Sentry.captureException).toHaveBeenCalled();
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
