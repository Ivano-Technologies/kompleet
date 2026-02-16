import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Mock supabase server client
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
  })),
}));

import { requireAuth } from './auth';
import { redirect } from 'next/navigation';

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when no user is authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    await expect(requireAuth()).rejects.toThrow('REDIRECT:/login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to /verify-email when email is not confirmed', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          email_confirmed_at: null,
        },
      },
    });

    await expect(requireAuth()).rejects.toThrow('REDIRECT:/verify-email');
    expect(redirect).toHaveBeenCalledWith('/verify-email');
  });

  it('returns user when authenticated and email is confirmed', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z',
    };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    const result = await requireAuth();
    expect(result).toEqual(mockUser);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('returns user with all metadata intact', async () => {
    const mockUser = {
      id: 'user-456',
      email: 'admin@kompleet.ng',
      email_confirmed_at: '2024-06-15T10:30:00Z',
      user_metadata: { first_name: 'Ade', last_name: 'Johnson' },
    };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    const result = await requireAuth();
    expect(result.id).toBe('user-456');
    expect(result.email).toBe('admin@kompleet.ng');
    expect(result.user_metadata.first_name).toBe('Ade');
  });
});
