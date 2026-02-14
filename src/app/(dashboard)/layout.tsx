import { requireAuth } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/dashboard';

export default async function DashboardRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  return (
    <DashboardShell user={{ email: user.email, id: user.id }}>
      {children}
    </DashboardShell>
  );
}
