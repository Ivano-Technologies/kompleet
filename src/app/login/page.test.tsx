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
    signIn.mockReset();
    search = new URLSearchParams("");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("shows the exact mismatch copy, a logged ref and the reclaim note on its own line", async () => {
    const raw = new Error("[Request ID: abc] Server Error\nUncaught Error: InvalidAccountId");
    signIn.mockRejectedValueOnce(raw);
    const user = userEvent.setup();
    render(<LoginPage />);
    const inputs = document.querySelectorAll("input");
    await user.type(inputs[0] as HTMLInputElement, "nobody@example.com");
    await user.type(inputs[1] as HTMLInputElement, "wrongpass1");
    await user.click(screen.getByRole("button", { name: /Sign In/ }));

    expect(
      await screen.findByText("That email or password doesn't match. Check and try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Request ID|InvalidAccountId/)).not.toBeInTheDocument();

    const ref = screen.getByTestId("error-ref").textContent ?? "";
    expect(ref).toMatch(/^Ref: [A-Z0-9]{8}$/);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(`ref=${ref.slice(5)}`),
      raw,
    );

    const note = screen.getByTestId("reclaim-note");
    expect(note.tagName).toBe("P");
    expect(note.className).toMatch(/text-xs/);
    expect(note.textContent).toBe(
      "Existing Kompleet users: choose Get started and use this same email to reclaim your data.",
    );
  });

  it("shows the exact expired-link copy with a ref", () => {
    search = new URLSearchParams("error=expired_link");
    render(<LoginPage />);
    expect(screen.getByText("This link has expired. Request a new one.")).toBeTruthy();
    expect(screen.getByTestId("error-ref").textContent).toMatch(/^Ref: [A-Z2-9]{8}$/);
  });
});
