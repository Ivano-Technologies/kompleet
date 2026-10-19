"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  classifyAuthLinkError,
  loginPathForLinkError,
  paramsFromHash,
} from "@/lib/auth/link-error";

/**
 * Supabase style providers report link failures in the URL hash on whatever
 * page the link landed on, for example
 * `/#error=access_denied&error_code=otp_expired`. The server never sees the
 * hash, so this client check sends the user to the friendly login message.
 */
export function AuthLinkErrorRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const kind = classifyAuthLinkError(paramsFromHash(hash));
    if (!kind) return;
    router.replace(loginPathForLinkError(kind));
  }, [router]);

  return null;
}
