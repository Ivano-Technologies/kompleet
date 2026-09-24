import type { AuthConfig } from "convex/server";

/**
 * Path B: Convex verifies Supabase Auth JWTs from KOMPLEET
 * (`frlcvkmjuhnjcicwywrh`). Issuer must match the GoTrue `iss` claim.
 * Algorithm is ES256 (asymmetric keys / JWKS). HS256 legacy JWTs will not verify.
 *
 * The issuer is a literal on purpose. Referencing `process.env.NEXT_PUBLIC_SUPABASE_URL`
 * here makes Convex refuse the first push until a dashboard env var is set, which
 * breaks `CONVEX_AGENT_MODE=anonymous` (CI e2e / cloud agents).
 */
const issuer = "https://frlcvkmjuhnjcicwywrh.supabase.co/auth/v1";

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
