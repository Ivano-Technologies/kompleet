import { requireAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard";

export default async function DashboardRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const displayName =
    user.user_metadata.full_name?.trim() ||
    [user.user_metadata.first_name, user.user_metadata.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
  return (
    <DashboardShell
      user={{
        email: user.email,
        id: user.id,
        role: user.app_metadata?.role,
        displayName: displayName || undefined,
      }}
    >
      {children}
    </DashboardShell>
  );
}
