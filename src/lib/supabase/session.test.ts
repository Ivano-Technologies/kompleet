/**
 * Unit tests for server session helpers
 *
 * These tests verify session management functions with mocked Supabase clients.
 * No network calls are made.
 */

import { describe, it, expect, vi } from "vitest";
import {
  getServerSession,
  getServerUser,
  requireServerUser,
  isAuthenticated,
  getUserId,
} from "./session";
import { SupabaseClient } from "@supabase/supabase-js";

// Mock user data
const mockUser = {
  id: "user-123",
  email: "test@example.com",
  aud: "authenticated",
  role: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  app_metadata: {},
  user_metadata: {},
};

const mockSession = {
  access_token: "mock-token",
  refresh_token: "mock-refresh",
  expires_in: 3600,
  token_type: "bearer",
  user: mockUser,
};

describe("getServerSession", () => {
  it("should return session when authenticated", async () => {
    const mockClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: mockSession },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    const result = await getServerSession(mockClient);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockSession);
    }
  });

  it("should return null when not authenticated", async () => {
    const mockClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    const result = await getServerSession(mockClient);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("should return error on failure", async () => {
    const mockClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: { message: "Auth error" },
        }),
      },
    } as unknown as SupabaseClient;

    const result = await getServerSession(mockClient);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Auth error");
    }
  });
});

describe("getServerUser", () => {
  it("should return user when authenticated", async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    const result = await getServerUser(mockClient);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockUser);
    }
  });

  it("should return null when not authenticated", async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    const result = await getServerUser(mockClient);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("should return error on failure", async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "User fetch error" },
        }),
      },
    } as unknown as SupabaseClient;

    const result = await getServerUser(mockClient);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("User fetch error");
    }
  });
});

describe("requireServerUser", () => {
  it("should return user when authenticated", async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    const user = await requireServerUser(mockClient);

    expect(user).toEqual(mockUser);
  });

  it("should throw when not authenticated", async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    await expect(requireServerUser(mockClient)).rejects.toThrow(
      "Authentication required",
    );
  });

  it("should throw on error", async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Auth failure" },
        }),
      },
    } as unknown as SupabaseClient;

    await expect(requireServerUser(mockClient)).rejects.toThrow("Auth failure");
  });
});

describe("isAuthenticated", () => {
  it("should return true when authenticated", async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    const result = await isAuthenticated(mockClient);

    expect(result).toBe(true);
  });

  it("should return false when not authenticated", async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    const result = await isAuthenticated(mockClient);

    expect(result).toBe(false);
  });
});

describe("getUserId", () => {
  it("should return user ID when authenticated", async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    const userId = await getUserId(mockClient);

    expect(userId).toBe("user-123");
  });

  it("should return null when not authenticated", async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    const userId = await getUserId(mockClient);

    expect(userId).toBeNull();
  });
});
