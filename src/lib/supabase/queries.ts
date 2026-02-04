/**
 * Supabase Query Functions
 * 
 * This module provides reusable query functions that work identically across:
 * - Server Components
 * - Route Handlers
 * - Server Actions
 * 
 * Key principles:
 * - Accept SupabaseClient as parameter (never instantiate internally)
 * - Pure data access (no side effects)
 * - Fully typed responses
 * - Testable with mocked clients
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Generic query result type
 */
export type QueryResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * User profile type
 * TODO: Replace with actual database schema types
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch user profile by ID
 * 
 * @param client - Supabase client instance (server or client)
 * @param userId - User ID to fetch
 * @returns Query result with user profile or error
 * 
 * @example
 * ```ts
 * // In Server Component
 * import { createServerClient } from '@/lib/supabase/server';
 * import { getUserProfile } from '@/lib/supabase/queries';
 * 
 * export default async function ProfilePage() {
 *   const supabase = createServerClient();
 *   const result = await getUserProfile(supabase, 'user-id');
 *   
 *   if (!result.success) {
 *     return <div>Error: {result.error}</div>;
 *   }
 *   
 *   return <div>Welcome, {result.data.full_name}</div>;
 * }
 * ```
 * 
 * @example
 * ```ts
 * // In Route Handler
 * import { createServerClient } from '@/lib/supabase/server';
 * import { getUserProfile } from '@/lib/supabase/queries';
 * 
 * export async function GET(request: Request) {
 *   const supabase = createServerClient();
 *   const result = await getUserProfile(supabase, 'user-id');
 *   
 *   if (!result.success) {
 *     return Response.json({ error: result.error }, { status: 500 });
 *   }
 *   
 *   return Response.json(result.data);
 * }
 * ```
 */
export async function getUserProfile(
  client: SupabaseClient,
  userId: string
): Promise<QueryResult<UserProfile>> {
  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to fetch user profile: ${error.message}`,
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'User profile not found',
      };
    }

    return {
      success: true,
      data: data as UserProfile,
    };
  } catch (err) {
    return {
      success: false,
      error: `Unexpected error fetching user profile: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * Update user profile
 * 
 * @param client - Supabase client instance
 * @param userId - User ID to update
 * @param updates - Partial profile data to update
 * @returns Query result with updated profile or error
 */
export async function updateUserProfile(
  client: SupabaseClient,
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
): Promise<QueryResult<UserProfile>> {
  try {
    const { data, error } = await client
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to update user profile: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data as UserProfile,
    };
  } catch (err) {
    return {
      success: false,
      error: `Unexpected error updating user profile: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * List all user profiles (admin function)
 * 
 * @param client - Supabase client instance
 * @param limit - Maximum number of profiles to return
 * @param offset - Number of profiles to skip
 * @returns Query result with profile list or error
 */
export async function listUserProfiles(
  client: SupabaseClient,
  limit = 50,
  offset = 0
): Promise<QueryResult<UserProfile[]>> {
  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: `Failed to list user profiles: ${error.message}`,
      };
    }

    return {
      success: true,
      data: (data as UserProfile[]) || [],
    };
  } catch (err) {
    return {
      success: false,
      error: `Unexpected error listing user profiles: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if user profile exists
 * 
 * @param client - Supabase client instance
 * @param userId - User ID to check
 * @returns True if profile exists, false otherwise
 */
export async function userProfileExists(
  client: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await client
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    return !error && data !== null;
  } catch {
    return false;
  }
}
