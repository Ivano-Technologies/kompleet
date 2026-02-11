# Authentication Migration Plan - Supabase to Clerk

## Current State (MVP)

**Active:** Supabase Auth
- Middleware: `middleware.ts` uses `@supabase/ssr`
- Sign-in/Signup: `@supabase/auth-ui-react` components
- RLS: Policies use `auth.uid()` (Supabase native)
- Status: ✅ Working in production

## Future Migration (Post-MVP)

**Target:** Clerk Auth
- Better UI/UX
- More OAuth providers
- Advanced security features

### Migration Checklist (Deferred)

- [ ] **Phase 1: Setup**
  - [ ] Apply `CLERK_SYNC_MIGRATION.sql` to create `clerk_users` table
  - [ ] Configure Clerk JWT template in Clerk dashboard
  - [ ] Set up Clerk webhook for user sync

- [ ] **Phase 2: Code Changes**
  - [ ] Update `middleware.ts` to use `@clerk/nextjs`
  - [ ] Replace sign-in page with Clerk `<SignIn />` component
  - [ ] Replace signup page with Clerk `<SignUp />` component
  - [ ] Update RLS policies to use Clerk JWT claims instead of `auth.uid()`

- [ ] **Phase 3: Data Migration**
  - [ ] Migrate existing users from `auth.users` to `clerk_users`
  - [ ] Update all user_id foreign keys
  - [ ] Test RLS policies with Clerk JWTs

- [ ] **Phase 4: Testing**
  - [ ] E2E test: Signup → Login → Dashboard
  - [ ] Verify RLS isolation (User A can't see User B's data)
  - [ ] Test OAuth flows (Google, GitHub, etc.)

- [ ] **Phase 5: Deployment**
  - [ ] Deploy to staging
  - [ ] Verify all existing users can still login
  - [ ] Monitor for auth errors
  - [ ] Deploy to production

**Estimated Effort:** 12-16 hours
**Priority:** Post-MVP (Phase 3+)
**Dependencies:** MVP launch, stable user base

## Why Defer?

1. **Supabase Auth works** - No blocking issues
2. **Fast to MVP** - Avoid 12+ hours of migration work
3. **Low risk** - Clerk migration can happen anytime post-launch
4. **User impact** - Can migrate users transparently with proper planning

## Notes

- Clerk credentials already exist in `.env.local`
- Migration SQL files already prepared
- Can switch anytime without data loss
