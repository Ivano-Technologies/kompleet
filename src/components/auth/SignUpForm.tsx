"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { ErrorText } from "@/components/ui/error-ref";
import { authErrorText, mapAuthError } from "@/lib/auth/map-error";
import { didSignInComplete, verifyEmailPath } from "@/lib/auth/sign-in-result";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signIn } = useAuthActions();
  const router = useRouter();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await signIn("password", { email, password, flow: "signUp" });
      if (didSignInComplete(result)) {
        setSuccess(true);
        router.push("/dashboard");
        router.refresh();
        return;
      }
      router.push(verifyEmailPath(email));
      router.refresh();
    } catch (err) {
      setError(authErrorText(mapAuthError(err, "signup")));
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded border px-3 py-2"
      />

      <input
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded border px-3 py-2"
      />

      {error && (
        <p className="text-sm text-red-500">
          <ErrorText text={error} issueGeneratedRef={false} />
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600">Account created.</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-black py-2 text-white"
      >
        {loading ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
