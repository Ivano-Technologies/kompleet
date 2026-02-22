import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  // Read role from app_metadata (admin-only writable)
  const role = user.app_metadata?.role;

  if (!role || !["owner", "admin"].includes(role)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
