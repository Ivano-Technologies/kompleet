/**
 * Unit tests for Supabase query functions
 * 
 * These tests verify query functions work with mocked Supabase clients.
 * No network calls are made.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getUserProfile,
  updateUserProfile,
  listUserProfiles,
  userProfileExists,
  UserProfile,
} from './queries';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock user profile data
const mockProfile: UserProfile = {
  id: 'user-123',
  subscription_tier: 'professional',
  entity_type: 'individual',
  fiscal_year_start_month: 1,
  onboarding_completed: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('getUserProfile', () => {
  it('should return user profile when found', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await getUserProfile(mockClient, 'user-123');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockProfile);
    }
  });

  it('should return error when profile not found', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await getUserProfile(mockClient, 'user-123');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('not found');
    }
  });

  it('should return error on database error', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await getUserProfile(mockClient, 'user-123');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Database error');
    }
  });
});

describe('updateUserProfile', () => {
  it('should update user profile successfully', async () => {
    const updatedProfile = { ...mockProfile, subscription_tier: 'business' as const };

    const mockClient = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedProfile,
                error: null,
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await updateUserProfile(mockClient, 'user-123', {
      subscription_tier: 'business',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subscription_tier).toBe('business');
    }
  });

  it('should return error on update failure', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' },
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await updateUserProfile(mockClient, 'user-123', {
      subscription_tier: 'business',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Update failed');
    }
  });
});

describe('listUserProfiles', () => {
  it('should return list of user profiles', async () => {
    const mockProfiles = [mockProfile, { ...mockProfile, id: 'user-456' }];

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await listUserProfiles(mockClient, 50, 0);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('user-123');
    }
  });

  it('should return empty array when no profiles found', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await listUserProfiles(mockClient, 50, 0);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it('should return error on database error', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Query failed' },
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await listUserProfiles(mockClient, 50, 0);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Query failed');
    }
  });
});

describe('userProfileExists', () => {
  it('should return true when profile exists', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-123' },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const exists = await userProfileExists(mockClient, 'user-123');

    expect(exists).toBe(true);
  });

  it('should return false when profile does not exist', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const exists = await userProfileExists(mockClient, 'user-123');

    expect(exists).toBe(false);
  });
});
