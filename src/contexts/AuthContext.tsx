"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import type { CompatUser } from "@/lib/auth/compat-user";

interface AuthContextType {
  user: CompatUser | null;
  session: { access_token: string } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut: convexSignOut } = useAuthActions();
  const [user, setUser] = useState<CompatUser | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setUser(null);
      return;
    }
    void fetch("/api/auth/ensure-profile", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) return;
        const body = (await res.json()) as {
          profile?: { id: string; email: string; full_name: string | null; company_name: string | null };
        };
        if (body.profile) {
          const { profileToCompatUser } = await import("@/lib/auth/compat-user");
          setUser(profileToCompatUser(body.profile));
        }
      })
      .catch((err: unknown) => {
        console.error("Convex ensure-profile failed", err);
      });
  }, [isLoading, isAuthenticated]);

  const signOut = async () => {
    await convexSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: isAuthenticated ? { access_token: "convex" } : null,
        loading: isLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
