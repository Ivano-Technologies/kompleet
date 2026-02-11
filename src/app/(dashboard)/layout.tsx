import { requireAuth } from '@/lib/auth';

export default async function DashboardRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <>{children}</>;
}
