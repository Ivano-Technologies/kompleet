import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import Forbidden from "@/app/403/page";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("403 page", () => {
  it("matches the 404: grey numeral, one teal primary action, a ref", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Forbidden />);
    const numeral = screen.getByText("403");
    expect(numeral.className).toContain("text-primary/10");
    expect(numeral.className).not.toMatch(/text-red/);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0].textContent).toBe("Go to dashboard");
    expect(links[0].className).toContain("bg-accent");
    expect(links[0].className).not.toContain("--primary");
    expect(screen.getByTestId("error-ref")).toBeTruthy();
  });
});
