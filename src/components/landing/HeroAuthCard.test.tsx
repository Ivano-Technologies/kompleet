import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import HeroAuthCard from "@/components/landing/HeroAuthCard";
import { requestHeroAuth } from "@/components/landing/hero-auth";

const signIn = vi.fn();
const push = vi.fn();
const refresh = vi.fn();

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("HeroAuthCard", () => {
  it("defaults to signup and toggles to sign-in without Google", async () => {
    const user = userEvent.setup();
    render(<HeroAuthCard />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Get started" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/google/i)).not.toBeInTheDocument();
    expect(
      screen.getByText("Free during beta. No credit card required."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(
      screen.getByRole("button", { name: "Get started" }),
    ).toHaveAttribute("type", "button");
  });

  it("switches to sign-in when the nav requests hero auth", async () => {
    render(<HeroAuthCard />);

    act(() => {
      requestHeroAuth("signin");
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute(
        "type",
        "submit",
      );
    });
  });
});
