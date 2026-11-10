/**
 * Convex Auth (web). CONVEX_SITE_URL is a Convex-provided env and is safe
 * to reference here.
 *
 * Do not add a custom JWT / JWKS provider. Legacy Supabase issuer trust
 * was removed so an old project signing key cannot mint a Convex identity.
 */
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
