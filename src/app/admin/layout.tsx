import { requireAuth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  // Verify user has admin or owner role
  const supabase = await createServerClient();
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !['owner', 'admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
