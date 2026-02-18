/**
 * Auth Helpers (Client-Side Only)
 * ================================
 * Authentication utility functions for browser use.
 * 
 * All functions require an explicit Supabase client parameter.
 * This makes them testable and avoids hidden global state.
 *
 * USAGE:
 *   import { createSupabaseClient } from '@/lib/supabase/client';
 *   import { signInWithEmail, getCurrentUser } from '@/lib/supabase/auth';
 *
 *   const supabase = createSupabaseClient();
 *   const { user, error } = await signInWithEmail(supabase, email, password);
 */

import type { TypedSupabaseClient } from './client';
import type { Session, User } from '@supabase/supabase-js';

// ============================================================
// RESULT TYPES
// ============================================================

export interface AuthResult<T> {
  data: T | null;
  error: string | null;
}

export interface SignInResult {
  user: User | null;
  session: Session | null;
  error: string | null;
}

export interface SignUpResult {
  user: User | null;
  session: Session | null;
  error: string | null;
  /** True if email confirmation is required */
  confirmationRequired: boolean;
}

// ============================================================
// SIGN IN
// ============================================================

/**
 * Sign in with email and password.
 *
 * @example
 * const supabase = createSupabaseClient();
 * const { user, session, error } = await signInWithEmail(
 *   supabase,
 *   'user@example.com',
 *   'password123'
 * );
 *
 * if (error) {
 *   console.error('Login failed:', error);
 * } else {
 *   console.log('Logged in as:', user?.email);
 * }
 */
export async function signInWithEmail(
  supabase: TypedSupabaseClient,
  email: string,
  password: string
): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      user: null,
      session: null,
      error: error.message,
    };
  }

  return {
    user: data.user,
    session: data.session,
    error: null,
  };
}

/**
 * Sign in with OAuth provider (Google, etc.).
 * Redirects the browser to the OAuth provider.
 *
 * @example
 * const supabase = createSupabaseClient();
 * const { error } = await signInWithOAuth(supabase, 'google');
 */
export async function signInWithOAuth(
  supabase: TypedSupabaseClient,
  provider: 'google' | 'github' | 'facebook',
  options?: {
    redirectTo?: string;
    scopes?: string;
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: options?.redirectTo ?? `${window.location.origin}/auth/callback`,
      scopes: options?.scopes,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Sign in with phone number (sends OTP).
 *
 * @example
 * const { error } = await signInWithPhone(supabase, '+2348012345678');
 * // User will receive SMS with OTP
 */
export async function signInWithPhone(
  supabase: TypedSupabaseClient,
  phone: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Verify phone OTP to complete sign in.
 *
 * @example
 * const { user, session, error } = await verifyPhoneOTP(
 *   supabase,
 *   '+2348012345678',
 *   '123456'
 * );
 */
export async function verifyPhoneOTP(
  supabase: TypedSupabaseClient,
  phone: string,
  token: string
): Promise<SignInResult> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) {
    return {
      user: null,
      session: null,
      error: error.message,
    };
  }

  return {
    user: data.user,
    session: data.session,
    error: null,
  };
}

// ============================================================
// SIGN UP
// ============================================================

/**
 * Sign up with email and password.
 *
 * @example
 * const { user, confirmationRequired, error } = await signUpWithEmail(
 *   supabase,
 *   'user@example.com',
 *   'password123',
 *   { fullName: 'John Doe', entityType: 'individual' }
 * );
 *
 * if (confirmationRequired) {
 *   // Show "check your email" message
 * }
 */
export async function signUpWithEmail(
  supabase: TypedSupabaseClient,
  email: string,
  password: string,
  metadata?: {
    fullName?: string;
    entityType?: 'individual' | 'company';
    phone?: string;
  }
): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: metadata?.fullName,
        entity_type: metadata?.entityType ?? 'individual',
        phone: metadata?.phone,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return {
      user: null,
      session: null,
      error: error.message,
      confirmationRequired: false,
    };
  }

  // Check if email confirmation is required
  // If session is null but user exists, confirmation is pending
  const confirmationRequired = data.user !== null && data.session === null;

  return {
    user: data.user,
    session: data.session,
    error: null,
    confirmationRequired,
  };
}

// ============================================================
// SIGN OUT
// ============================================================

/**
 * Sign out the current user.
 * Clears the session from localStorage.
 *
 * @example
 * const supabase = createSupabaseClient();
 * const { error } = await signOut(supabase);
 *
 * if (!error) {
 *   // Redirect to login page
 *   window.location.href = '/login';
 * }
 */
export async function signOut(
  supabase: TypedSupabaseClient
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// ============================================================
// SESSION & USER
// ============================================================

/**
 * Get the current session.
 * Returns null if not authenticated.
 *
 * @example
 * const supabase = createSupabaseClient();
 * const { session } = await getSession(supabase);
 *
 * if (session) {
 *   console.log('Logged in, token expires at:', session.expires_at);
 * }
 */
export async function getSession(
  supabase: TypedSupabaseClient
): Promise<AuthResult<Session>> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data.session, error: null };
}

/**
 * Get the current authenticated user.
 * Returns null if not authenticated.
 *
 * NOTE: This makes a network request to validate the session.
 * For UI display, prefer using the session's user object.
 *
 * @example
 * const supabase = createSupabaseClient();
 * const { user } = await getCurrentUser(supabase);
 *
 * if (user) {
 *   console.log('Current user:', user.email);
 * }
 */
export async function getCurrentUser(
  supabase: TypedSupabaseClient
): Promise<AuthResult<User>> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data.user, error: null };
}

/**
 * Check if user is authenticated.
 * Quick check using cached session.
 *
 * @example
 * const isLoggedIn = await isAuthenticated(supabase);
 */
export async function isAuthenticated(
  supabase: TypedSupabaseClient
): Promise<boolean> {
  const { data } = await getSession(supabase);
  return data !== null;
}

// ============================================================
// PASSWORD MANAGEMENT
// ============================================================

/**
 * Send password reset email.
 *
 * @example
 * const { error } = await resetPassword(supabase, 'user@example.com');
 *
 * if (!error) {
 *   // Show "check your email" message
 * }
 */
export async function resetPassword(
  supabase: TypedSupabaseClient,
  email: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback`,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Update password (when user is logged in or has reset token).
 *
 * @example
 * const { error } = await updatePassword(supabase, 'newPassword123');
 */
export async function updatePassword(
  supabase: TypedSupabaseClient,
  newPassword: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// ============================================================
// AUTH STATE LISTENER
// ============================================================

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 *
 * @example
 * const supabase = createSupabaseClient();
 *
 * const unsubscribe = onAuthStateChange(supabase, (event, session) => {
 *   if (event === 'SIGNED_IN') {
 *     console.log('User signed in:', session?.user.email);
 *   } else if (event === 'SIGNED_OUT') {
 *     console.log('User signed out');
 *   }
 * });
 *
 * // Later: clean up
 * unsubscribe();
 */
export function onAuthStateChange(
  supabase: TypedSupabaseClient,
  callback: (
    event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'PASSWORD_RECOVERY',
    session: Session | null
  ) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event as Parameters<typeof callback>[0], session);
    }
  );

  return () => subscription.unsubscribe();
}
