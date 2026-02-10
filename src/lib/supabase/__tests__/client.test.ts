/**
 * Supabase Client Tests
 * =====================
 * Smoke tests for client creation and configuration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @supabase/supabase-js before importing our module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  })),
}));

describe('Supabase Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to clear cached client
    vi.resetModules();
    
    // Set up environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-12345',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('createSupabaseClient', () => {
    it('should create a Supabase client successfully', async () => {
      const { createSupabaseClient } = await import('../client');
      
      const client = createSupabaseClient();
      
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
      expect(client.from).toBeDefined();
    });

    it('should create a client with auth methods', async () => {
      const { createSupabaseClient } = await import('../client');
      
      const client = createSupabaseClient();
      
      expect(typeof client.auth.getSession).toBe('function');
      expect(typeof client.auth.getUser).toBe('function');
      expect(typeof client.auth.signInWithPassword).toBe('function');
      expect(typeof client.auth.signOut).toBe('function');
    });

    it('should create a client with query methods', async () => {
      const { createSupabaseClient } = await import('../client');
      
      const client = createSupabaseClient();
      const query = client.from('profiles');
      
      expect(typeof query.select).toBe('function');
      expect(typeof query.insert).toBe('function');
      expect(typeof query.update).toBe('function');
      expect(typeof query.delete).toBe('function');
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      const { createSupabaseClient } = await import('../client');
      
      expect(() => createSupabaseClient()).toThrow(
        'Missing NEXT_PUBLIC_SUPABASE_URL environment variable'
      );
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const { createSupabaseClient } = await import('../client');
      
      expect(() => createSupabaseClient()).toThrow(
        'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable'
      );
    });
  });

  describe('createSupabaseClientWithOptions', () => {
    it('should create a client with custom options', async () => {
      const { createSupabaseClientWithOptions } = await import('../client');
      
      const client = createSupabaseClientWithOptions({
        auth: { persistSession: false },
      });
      
      expect(client).toBeDefined();
    });
  });
});
