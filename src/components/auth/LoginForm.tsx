"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { FRIENDLY_MESSAGES, toFriendlyError, withRef } from "@/lib/friendly-error";
import { ErrorText } from "@/components/ui/error-ref";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuthActions();
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn("password", { email, password, flow: "signIn" });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const { message, ref } = toFriendlyError(err, FRIENDLY_MESSAGES.fallback, {
        context: "login-form",
      });
      setError(
        withRef(
          message === FRIENDLY_MESSAGES.network || message === FRIENDLY_MESSAGES.rateLimited
            ? message
            : FRIENDLY_MESSAGES.invalidCredentials,
          ref,
        ),
      );
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded border px-3 py-2"
      />

      <input
        type="password"
        placeholder="Password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded border px-3 py-2"
      />

      {error && <p className="text-sm text-red-500"><ErrorText text={error} /></p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-black py-2 text-white"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
