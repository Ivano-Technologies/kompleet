/**
 * Generate JWT_PRIVATE_KEY + JWKS for @convex-dev/auth.
 *
 * Usage:
 *   node scripts/generate-convex-auth-keys.mjs
 *
 * Then set both values on the Convex deployment (dashboard or):
 *   npx convex env set JWT_PRIVATE_KEY "..."
 *   npx convex env set JWKS "..."
 *   npx convex env set SITE_URL https://kompleet-git-staging-techivano.vercel.app
 *
 * Optional password-reset email:
 *   npx convex env set AUTH_RESEND_KEY "re_..."
 */
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

process.stdout.write(
  `JWT_PRIVATE_KEY="${privateKey.trimEnd().replace(/\n/g, " ")}"\n`,
);
process.stdout.write(`JWKS=${jwks}\n`);
