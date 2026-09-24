/**
 * Convex Auth (web) + leftover Supabase JWT (mobile soak).
 *
 * Web sign-in uses @convex-dev/auth. CONVEX_SITE_URL is a Convex-provided env
 * and is safe to reference here. The Supabase JWKS provider stays so the
 * Expo app can keep calling Convex with GoTrue tokens until a mobile cutover.
 *
 * Do not reference NEXT_PUBLIC_SUPABASE_URL — Convex refuses the first push
 * until that dashboard var exists, which breaks CONVEX_AGENT_MODE=anonymous.
 */
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
    {
      type: "customJwt",
      applicationID: "authenticated",
      issuer: "https://frlcvkmjuhnjcicwywrh.supabase.co/auth/v1",
      jwks:
        "https://frlcvkmjuhnjcicwywrh.supabase.co/auth/v1/.well-known/jwks.json",
      algorithm: "ES256",
    },
  ],
};
