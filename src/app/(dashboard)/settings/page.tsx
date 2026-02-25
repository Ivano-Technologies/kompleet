import { redirect } from "next/navigation";

/**
 * Settings is now a modal opened from the sidebar/top bar.
 * Redirect /settings to dashboard with modal open.
 */
export default function SettingsRedirectPage() {
  redirect("/dashboard?settings=open");
}
