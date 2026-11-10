import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/nextjs";
import LoginPage from "@/app/login/page";

const signIn = vi.fn();
let search = new URLSearchParams("");

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => search,
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/components/layout/AuthLayout", () => ({
  AuthLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    signIn.mockReset();
    search = new URLSearchParams("");
    vi.mocked(Sentry.captureException).mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("shows the exact mismatch copy without a support Ref", async () => {
    const raw = new Error("[Request ID: abc] Server Error\nUncaught Error: InvalidAccountId");
    signIn.mockRejectedValueOnce(raw);
    const user = userEvent.setup();
    render(<LoginPage />);
    const inputs = document.querySelectorAll("input");
    await user.type(inputs[0] as HTMLInputElement, "nobody@example.com");
    await user.type(inputs[1] as HTMLInputElement, "wrongpass1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("That email or password doesn't match. Check and try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Request ID|InvalidAccountId/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
    expect(screen.queryByText(/Already used Kompleet/)).not.toBeInTheDocument();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("masks a proxied TOO_MANY_ATTEMPTS as doesn't match without Sentry or a Ref", async () => {
    signIn.mockRejectedValueOnce(
      new Error(
        `[Request ID: 7f3a9c1e2b] Server Error\nUncaught ConvexError: ${JSON.stringify({
          code: "TOO_MANY_ATTEMPTS",
          retryAfterSeconds: 3600,
        })}`,
      ),
    );
    const user = userEvent.setup();
    render(<LoginPage />);
    const inputs = document.querySelectorAll("input");
    await user.type(inputs[0] as HTMLInputElement, "jane@example.com");
    await user.type(inputs[1] as HTMLInputElement, "wrongpass1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("That email or password doesn't match. Check and try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Too many attempts/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("shows the exact expired-link copy without a support Ref", () => {
    search = new URLSearchParams("error=expired_link");
    render(<LoginPage />);
    expect(screen.getByText("This link has expired. Request a new one.")).toBeTruthy();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("shows the auth_failed copy without a support Ref", () => {
    search = new URLSearchParams("error=auth_failed");
    render(<LoginPage />);
    expect(screen.getByText("We couldn't sign you in. Please try again.")).toBeTruthy();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("never renders free text from the error param", () => {
    search = new URLSearchParams("error=Database+exploded");
    render(<LoginPage />);
    expect(screen.queryByText(/Database exploded/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
  });
});
