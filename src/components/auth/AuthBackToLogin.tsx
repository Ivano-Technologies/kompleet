import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AUTH_LINK_MUTED } from "@/components/layout/auth-density";

/** Shared auth header back link: arrow plus sentence-case "Back to login". */
export function AuthBackToLogin() {
  return (
    <Link
      href="/login"
      className={`flex items-center gap-1.5 ${AUTH_LINK_MUTED}`}
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to login
    </Link>
  );
}
