/**
 * Generate JWT_PRIVATE_KEY + JWKS for @convex-dev/auth (Node crypto, no jose).
 *
 * Usage:
 *   node scripts/generate-convex-auth-keys.mjs
 *   node scripts/generate-convex-auth-keys.mjs --apply
 *
 * `--apply` writes JWT_PRIVATE_KEY, JWKS, and SITE_URL onto the current
 * Convex deployment (`CONVEX_DEPLOYMENT` / `.env.local`). Used by CI
 * anonymous backends that otherwise cannot issue auth tokens.
 *
 * Manual set (dashboard or):
 *   npx convex env set JWT_PRIVATE_KEY "..."
 *   npx convex env set JWKS "..."
 *   npx convex env set SITE_URL https://kompleet-git-staging-techivano.vercel.app
 *
 * Optional password-reset email:
 *   npx convex env set AUTH_RESEND_KEY "re_..."
 */
import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";

const apply = process.argv.includes("--apply");
const siteUrl = process.env.CONVEX_AUTH_SITE_URL || "http://localhost:3000";

// jose is not a direct dependency (pnpm will not resolve it from this
// script in CI). Node's RSA PKCS8 + JWK is what @convex-dev/auth expects.
const pair = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "jwk" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
const privateKey = pair.privateKey.trimEnd().replace(/\n/g, " ");
const jwks = JSON.stringify({
  keys: [{ use: "sig", alg: "RS256", ...pair.publicKey }],
});

if (!apply) {
  process.stdout.write(`JWT_PRIVATE_KEY="${privateKey}"\n`);
  process.stdout.write(`JWKS=${jwks}\n`);
  process.exit(0);
}

function setConvexEnv(name, value) {
  const result = spawnSync(
    "pnpm",
    ["exec", "convex", "env", "set", "--force", name, value],
    { stdio: "inherit", env: process.env },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

setConvexEnv("JWT_PRIVATE_KEY", privateKey);
setConvexEnv("JWKS", jwks);
setConvexEnv("SITE_URL", siteUrl);
process.stderr.write(
  `Set JWT_PRIVATE_KEY, JWKS, and SITE_URL=${siteUrl} on Convex.\n`,
);
