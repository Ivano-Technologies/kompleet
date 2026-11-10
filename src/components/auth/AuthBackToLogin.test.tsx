import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AuthBackToLogin } from "./AuthBackToLogin";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("AuthBackToLogin", () => {
  it("renders the arrow and sentence-case label", () => {
    const { container } = render(<AuthBackToLogin />);
    const link = screen.getByRole("link", { name: "Back to login" });
    expect(link).toHaveAttribute("href", "/login");
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
