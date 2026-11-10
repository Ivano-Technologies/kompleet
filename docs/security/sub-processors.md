# Sub-processor register

Processors that may see Kompleet personal data. **Regions and DPAs need owner confirmation.** Optional processors only receive data when the matching env vars are set.

| Processor | Role | When it is used | Personal data (typical) |
|---|---|---|---|
| Convex | Database, Auth, file `_storage`, scheduled functions | Always | Account, books, files, session metadata |
| Vercel | Hosts the Next.js app (production region **iad1** in current config) | Always | HTTP logs, cookies, IP as logged by the platform |
| Resend | Transactional email (password reset, email verification OTP) | When `AUTH_RESEND_KEY` / `RESEND_API_KEY` is set | Email address, OTP mail |
| Sentry | Error monitoring | When Sentry DSN is set | Stack traces, URL, truncated request context — **should not** include passwords or OTPs |

## Optional (env-gated)

| Processor | Role | Gate |
|---|---|---|
| OpenAI | Categorisation / parsers when chosen | Server OpenAI key (not a `NEXT_PUBLIC_` key) |
| Anthropic | Same, when chosen | Anthropic key |
| Moonshot | Same, when chosen | Moonshot key |
| Upstash Redis | Multi-instance rate limiting | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (sibling PR; absent → in-memory fallback) |

If those vars are unset, the app does not call that processor.

## Not processors (needs confirmation)

GitHub (source + CI) and the operator laptops are **controller-side tools**. Whether GitHub is listed as a processor for this product is **needs owner confirmation**.

## Owner checklist

- [ ] Signed DPA / SCCs with Convex, Vercel, Resend, Sentry
- [ ] Confirm data region for Convex and Resend
- [ ] Confirm whether AI providers are used in production
- [ ] Confirm Upstash if Redis rate limiting is enabled
