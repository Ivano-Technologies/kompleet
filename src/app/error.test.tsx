import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import AppError from "@/app/error";
import DashboardError from "@/app/(dashboard)/error";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const raw = Object.assign(
  new Error("[Request ID: 9a8b7c] Server Error\nUncaught Error: secret detail"),
  { digest: "123" },
);

describe.each([
  ["app", AppError],
  ["dashboard", DashboardError],
])("%s error boundary", (_name, Boundary) => {
  it("shows a friendly page and never the raw error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    render(<Boundary error={raw} reset={reset} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.queryByText(/Request ID|secret detail|Server Error/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Go home/ })).toBeInTheDocument();

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /Try again/ }));
    expect(reset).toHaveBeenCalled();
  });
});
