import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const mockGetCompatUser = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getCompatUser: (...args: unknown[]) => mockGetCompatUser(...args),
}));

import { requireAuth } from "./auth";
import { redirect } from "next/navigation";
import { EMAIL_VERIFICATION_REQUIRED_AFTER_MS } from "@/lib/auth/email-verified";

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when no user is authenticated", async () => {
    mockGetCompatUser.mockResolvedValue(null);

    await expect(requireAuth()).rejects.toThrow("REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns the Convex Auth user when authenticated and verified", async () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      email_confirmed_at: "2026-01-01T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { role: "user", provider: "convex" },
      user_metadata: { full_name: "Test User" },
    };
    mockGetCompatUser.mockResolvedValue(mockUser);

    const result = await requireAuth();
    expect(result).toEqual(mockUser);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects unverified new accounts to verify-email", async () => {
    mockGetCompatUser.mockResolvedValue({
      id: "user-new",
      email: "New@Example.com",
      email_confirmed_at: "",
      created_at: new Date(EMAIL_VERIFICATION_REQUIRED_AFTER_MS + 1).toISOString(),
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { role: "user", provider: "convex" },
      user_metadata: {},
    });

    await expect(requireAuth()).rejects.toThrow(
      "REDIRECT:/verify-email?email=new%40example.com",
    );
    expect(redirect).toHaveBeenCalledWith("/verify-email?email=new%40example.com");
  });
});
