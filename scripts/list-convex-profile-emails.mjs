#!/usr/bin/env node
/**
 * Print Convex profile emails so CoS can send reset / reclaim instructions.
 *
 * Existing passwords cannot be ported from Supabase Auth. Each user should
 * Sign up on /signup with the SAME email (new password). createOrUpdateUser
 * links the Convex Auth account to the existing profile + transactions.
 *
 * Usage (needs a Convex admin key / logged-in CLI):
 *   npx convex run users:listEmailsForMigration --push
 *
 * This file is the documented fallback if that query is not deployed yet.
 */
console.log(`
Kompleet Convex Auth reclaim (IVA-60)

1. Existing users (~5) keep their Convex profile + transactions (keyed by email).
2. Passwords do NOT migrate from Supabase.
3. Each user: open /signup, enter the same email, choose a new password.
4. After that, /login and /forgot-password work on Convex Auth.
5. If AUTH_RESEND_KEY is set on shiny-cricket-316, /forgot-password emails an OTP.

Do not invent or email temporary passwords.
`);
