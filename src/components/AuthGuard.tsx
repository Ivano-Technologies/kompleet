/**
 * AuthGuard Component
 * 
 * A reusable wrapper component that ensures a page is only accessible
 * to authenticated users. Redirects to login if not authenticated.
 * 
 * Usage:
 * ```tsx
 * export default async function ProtectedPage() {
 *   return (
 *     <AuthGuard>
 *       <YourContent />
 *     </AuthGuard>
 *   );
 * }
 * ```
 */

import { createServerClient } from '@/lib/supabase/server';
import { getServerUser } from '@/lib/supabase/session';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

export default async function AuthGuard({ 
  children, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const supabase = await createServerClient();
  const result = await getServerUser(supabase);

  // If auth check failed or no user, redirect to login
  if (!result.success || !result.data) {
    redirect(redirectTo);
  }

  // User is authenticated, render children
  return <>{children}</>;
}
