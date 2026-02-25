import { redirect } from "next/navigation";

/**
 * Notifications are now under Settings.
 * Redirect to dashboard with Settings modal open on Notifications section.
 */
export default function NotificationsRedirectPage() {
  redirect("/dashboard?settings=notifications");
}
