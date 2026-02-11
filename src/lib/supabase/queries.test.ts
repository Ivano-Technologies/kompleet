/**
 * Tests for Database Queries
 * =====
 */

import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import {
  getUserProfile,
  updateUserProfile,
  listUserProfiles,
  userProfileExists,
} from './queries';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

// Mock user profile data
const mockProfile: UserProfile = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  phone: null,
  entity_type: 'individual',
  tin: null,
  company_name: null,
  rc_number: null,
  company_address: null,
  vat_registered: false,
  vat_number: null,
  subscription_tier: 'professional',
  subscription_expires_at: null,
  monthly_transaction_count: 0,
  last_transaction_reset: null,
  deleted_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('getUserProfile', () => {
  it('should return user profile when found', async () => {
    const mockProfile = {
      id: 'user-123',
      full_name: 'John Doe',
      email: 'john@example.com',
    };

    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockProfile,
              error: null,
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await getUserProfile(mockClient, 'user-123');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockProfile);
    }
  });

  it('should return error when profile not found', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Profile not found' },
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await getUserProfile(mockClient, 'user-123');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('not found');
    }
  });

  it('should return error on database error', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database connection failed' },
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await getUserProfile(mockClient, 'user-123');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

// ====
// updateUserProfile Tests
// ====

describe('updateUserProfile', () => {
  it('should update user profile successfully', async () => {

    const updatedProfile = { ...mockProfile, subscription_tier: 'business' as const };

    const mockUpdatedProfile = {
      id: 'user-123',
      full_name: 'Updated Name',
      email: 'john@example.com',
      subscription_tier: 'professional',
    };


    const mockClient = {
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: mockUpdatedProfile,
                error: null,
              })),
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await updateUserProfile(mockClient, 'user-123', {
      subscription_tier: 'professional',
    });

    expect(result.success).toBe(true);
    if (result.success && result.data) {

      expect(result.data.subscription_tier).toBe('professional');

      expect(result.data.full_name).toBe('Updated Name');
    } else {
      // Handle error case
      expect(result.error).toBeDefined();

    }
  });

  it('should return error on update failure', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: { message: 'Update failed' },
              })),
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await updateUserProfile(mockClient, 'user-123', {
      subscription_tier: 'professional',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Update failed');
    }
  });
});

// ====
// listUserProfiles Tests
// ====

describe('listUserProfiles', () => {
  it('should return list of user profiles', async () => {
    const mockProfiles = [
      { id: 'user-123', full_name: 'John Doe', email: 'john@example.com' },
      { id: 'user-456', full_name: 'Jane Doe', email: 'jane@example.com' },
    ];

    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: mockProfiles,
            error: null,
            count: 2,
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await listUserProfiles(mockClient, 50, 0);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data![0].id).toBe('user-123');
    }
  });

  it('should return empty array when no profiles found', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: [],
            error: null,
            count: 0,
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await listUserProfiles(mockClient, 50, 0);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    }
  });

  it('should return error on database error', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Query failed' },
            count: null,
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await listUserProfiles(mockClient, 50, 0);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Query failed');
    }
  });
});

// ====
// userProfileExists Tests
// ====

describe('userProfileExists', () => {
  it('should return true when profile exists', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'user-123' },
              error: null,
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await userProfileExists(mockClient, 'user-123');

    expect(result).toBe(true);
  });

  it('should return false when profile does not exist', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'PGRST116', code: 'PGRST116' },
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await userProfileExists(mockClient, 'nonexistent-user');

    expect(result).toBe(false);
  });
});
