# Deployment Checklist: Kompleet Platform

**Date**: February 4, 2026

This checklist outlines the required environment variables, secrets, and pre-launch verification steps for deploying the Kompleet Platform to production.

---

## 1. Supabase Environment Variables

These variables must be set in your Vercel production environment.

| Variable                        | Description                                                                 | Example Value                              |
| ------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL.                                                  | `https://frlcvkmjuhnjcicwywrh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase project's public `anon` key.                                  | `eyJhbGciOi...`                            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Your Supabase project's `service_role` key. **CRITICAL**: Keep this secret. | `eyJhbGciOi...`                            |

**Security Note**: `SUPABASE_SERVICE_ROLE_KEY` must **NEVER** be exposed to the client-side. It should only be used in server-side environments.

---

## 2. Required Secrets

These secrets are used for various integrations and must be configured securely.

| Secret              | Description                                                 | Where to Find      |
| ------------------- | ----------------------------------------------------------- | ------------------ |
| `OPENAI_API_KEY`    | For AI-powered features (e.g., transaction categorization). | OpenAI Dashboard   |
| `STRIPE_SECRET_KEY` | For payment processing and subscription management.         | Stripe Dashboard   |
| `SENDGRID_API_KEY`  | For sending transactional emails (e.g., password resets).   | SendGrid Dashboard |

---

## 3. Production Toggles & Feature Flags

These flags can be used to enable or disable features in production.

| Flag                                | Description                                             | Recommended Value |
| ----------------------------------- | ------------------------------------------------------- | ----------------- |
| `ENABLE_EMAIL_CONFIRMATION`         | If `true`, users must confirm their email to log in.    | `true`            |
| `ENABLE_LEAKED_PASSWORD_PROTECTION` | If `true`, checks passwords against HaveIBeenPwned.org. | `true`            |
| `LOG_LEVEL`                         | Sets the application log level.                         | `info`            |

---

## 4. Pre-Launch Verification Steps

Before going live, manually verify the following flows in your production environment.

### Auth Flow

- [ ] **Signup**: Create a new account successfully.
- [ ] **Email Confirmation**: Receive the confirmation email and click the link.
- [ ] **Login**: Log in with the new account.
- [ ] **Logout**: Log out successfully.
- **Session Persistence**: Refresh the page while logged in and verify you remain logged in.

### Protected Routes

- [ ] **Dashboard Access**: Verify you can access `/dashboard` when logged in.
- [ ] **Dashboard Block**: Verify you are redirected to `/login` when trying to access `/dashboard` while logged out.
- [ ] **Profile Access**: Verify you can access your own `/profile` page.

### Database & RLS

- [ ] **Profile Data**: Verify your profile data is displayed correctly on the `/profile` page.
- [ ] **Ownership Test**: Manually attempt to access another user's data via URL manipulation (e.g., `/transactions/other-user-id`). Verify it fails.

### Hardening

- [ ] **Health Check**: Access `/api/health` and verify it returns `{"status":"ok"}`.
- [ ] **401 Page**: Navigate to a non-existent protected route and verify you are redirected to the login page.
- [ ] **403 Page**: (If applicable) Attempt an action you don't have permission for and verify the 403 page is shown.

---

## 5. Post-Launch Monitoring

- **Vercel Logs**: Monitor for any runtime errors or warnings.
- **Supabase Logs**: Check for any database errors or unusual query patterns.
- **Health Check**: Set up an external monitoring service (e.g., UptimeRobot) to ping `/api/health` periodically.
