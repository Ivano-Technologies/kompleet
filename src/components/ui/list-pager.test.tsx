/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadMoreButton, PageTurnButtons } from "./list-pager";

describe("PageTurnButtons", () => {
  it("renders 44px previous/next buttons and mutes both when disabled", () => {
    render(
      <PageTurnButtons
        pageLabel="1"
        prevDisabled
        nextDisabled
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    );
    const prev = screen.getByRole("button", { name: "Previous page" });
    const next = screen.getByRole("button", { name: "Next page" });
    expect(prev).toBeDisabled();
    expect(next).toBeDisabled();
    expect(prev.className).toMatch(/min-h-11/);
    expect(prev.className).toMatch(/min-w-11/);
    expect(prev.className).toMatch(/disabled:opacity-40/);
    expect(next.className).toMatch(/disabled:pointer-events-none/);
  });

  it("enables both buttons mid-list", () => {
    render(
      <PageTurnButtons
        pageLabel="2"
        prevDisabled={false}
        nextDisabled={false}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
  });
});

describe("LoadMoreButton", () => {
  it("shows a disabled Loading… state while fetching", () => {
    render(<LoadMoreButton loading onClick={vi.fn()} />);
    const button = screen.getByRole("button", { name: /Loading/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });
});
