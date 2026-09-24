import type { AuthConfig } from "convex/server";

/**
 * Path B: Convex verifies Supabase Auth JWTs.
 * Issuer must match the `iss` claim on GoTrue access tokens.
 * Algorithm is ES256 (asymmetric keys / JWKS). HS256 legacy JWTs will not verify.
 */
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://frlcvkmjuhnjcicwywrh.supabase.co";

const issuer = `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "authenticated",
      issuer,
      jwks: `${issuer}/.well-known/jwks.json`,
      algorithm: "ES256",
    },
  ],
} satisfies AuthConfig;
