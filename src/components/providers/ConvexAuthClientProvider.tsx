"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { useMemo, type ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";

export function ConvexAuthClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      return new ConvexReactClient("https://placeholder.convex.cloud");
    }
    return new ConvexReactClient(url);
  }, []);

  return (
    <ConvexAuthNextjsProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </ConvexAuthNextjsProvider>
  );
}
