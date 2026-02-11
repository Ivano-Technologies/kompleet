import { requireAuth } from '@/lib/auth';

export default async function MLGovernanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <>{children}</>;
}
