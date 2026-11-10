/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signOut: vi.fn() }),
}));

describe("sidebar account name", () => {
  it("shows the full first + last name, not only the first name", () => {
    render(
      <Sidebar
        userEmail="audit@fixture.test"
        userDisplayName="Audit Test"
        isMobileOpen={false}
        onMobileClose={() => undefined}
      />,
    );
    expect(screen.getByText("Audit Test")).toBeInTheDocument();
    expect(screen.getByText("audit@fixture.test")).toBeInTheDocument();
  });
});
