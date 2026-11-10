/**
 * @deprecated Import from `./security-headers.mjs`. Kept so older tests and
 * comments that name this file still resolve while the enforcing nonce CSP
 * lives in security-headers.mjs.
 */
export {
  buildContentSecurityPolicy,
  buildContentSecurityPolicy as CONTENT_SECURITY_POLICY_ENFORCING,
} from "./security-headers.mjs";
