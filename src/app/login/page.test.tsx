import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("shows the exact mismatch copy and a logged ref", async () => {
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

    const ref = screen.getByTestId("error-ref").textContent ?? "";
    expect(ref).toMatch(/^Ref: [A-Z0-9]{8}$/);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(`ref=${ref.slice(5)}`),
      raw,
    );
    expect(console.error).not.toHaveBeenCalled();
    expect(screen.queryByText(/Already used Kompleet/)).not.toBeInTheDocument();
  });

  it("shows the exact expired-link copy with a ref logged as a warning", () => {
    search = new URLSearchParams("error=expired_link");
    render(<LoginPage />);
    expect(screen.getByText("This link has expired. Request a new one.")).toBeTruthy();
    const ref = screen.getByTestId("error-ref").textContent ?? "";
    expect(ref).toMatch(/^Ref: [A-Z2-9]{8}$/);
    expect(console.warn).toHaveBeenCalledWith(
      `[friendly-error] ref=${ref.slice(5)} context=login:expired_link`,
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  it("shows the auth_failed copy with a ref logged as a warning", () => {
    search = new URLSearchParams("error=auth_failed");
    render(<LoginPage />);
    expect(screen.getByText("We couldn't sign you in. Please try again.")).toBeTruthy();
    const ref = screen.getByTestId("error-ref").textContent ?? "";
    expect(console.warn).toHaveBeenCalledWith(
      `[friendly-error] ref=${ref.slice(5)} context=login:auth_failed`,
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  it("never renders free text from the error param", () => {
    search = new URLSearchParams("error=Database+exploded");
    render(<LoginPage />);
    expect(screen.queryByText(/Database exploded/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
  });
});
