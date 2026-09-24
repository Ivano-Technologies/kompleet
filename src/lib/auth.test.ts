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

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when no user is authenticated", async () => {
    mockGetCompatUser.mockResolvedValue(null);

    await expect(requireAuth()).rejects.toThrow("REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns the Convex Auth user when authenticated", async () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      email_confirmed_at: "1970-01-01T00:00:00.000Z",
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
});
