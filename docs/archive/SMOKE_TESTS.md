# Post-Deployment Smoke Tests

This document outlines manual verification steps to perform after each deployment to ensure critical functionality works correctly.

## Purpose

Smoke tests are quick, high-level tests that verify the application's core features are functional after deployment. They catch major issues before users encounter them.

**Time to complete**: ~10-15 minutes  
**When to run**: After every production deployment  
**Who should run**: Developer, QA, or DevOps engineer

---

## Test Environment Preparation

Before starting tests:

1. **Open browser in incognito/private mode** (clean slate, no cached data)
2. **Open DevTools** (F12) and keep Console tab visible
3. **Have test credentials ready**:
   - Test email: `test-user-$(date +%s)@example.com` (unique per test)
   - Test password: Use a secure test password
4. **Note deployment URL**: `https://your-domain.com`

---

## Test 1: Homepage Load ✅

**Goal**: Verify the application loads without errors

### Steps

1. Navigate to `https://your-domain.com`
2. Wait for page to fully load

### Success Criteria

- [ ] Page loads within 3 seconds
- [ ] No JavaScript errors in console
- [ ] No 404 or 500 errors
- [ ] Page renders correctly (no broken layout)
- [ ] Navigation menu is visible and functional

### Common Issues

- **White screen**: Check Vercel function logs for errors
- **404 error**: Verify deployment completed successfully
- **Console errors**: Check for missing environment variables

---

## Test 2: User Registration 📝

**Goal**: Verify new users can create accounts

### Steps

1. Click "Sign Up" or navigate to `/signup`
2. Fill in registration form:
   - Email: `test-user-$(date +%s)@example.com`
   - Password: `TestPassword123!`
   - (Other fields as required)
3. Submit form
4. Check email inbox for confirmation email (if email confirmation is enabled)
5. Click confirmation link (if applicable)

### Success Criteria

- [ ] Registration form loads without errors
- [ ] Form validation works (e.g., invalid email shows error)
- [ ] Submission succeeds without errors
- [ ] User is redirected to appropriate page (dashboard or confirmation page)
- [ ] Confirmation email is received (if enabled)
- [ ] Confirmation link works (if applicable)
- [ ] User profile is created in Supabase (check Table Editor)

### Common Issues

- **"Email already exists"**: Use unique email with timestamp
- **No confirmation email**: Check Supabase email settings
- **Form submission hangs**: Check Vercel function logs and Supabase logs

---

## Test 3: User Login 🔐

**Goal**: Verify users can log in with valid credentials

### Steps

1. Log out if currently logged in
2. Navigate to `/login`
3. Enter credentials from Test 2
4. Submit login form

### Success Criteria

- [ ] Login form loads without errors
- [ ] Invalid credentials show appropriate error message
- [ ] Valid credentials log user in successfully
- [ ] User is redirected to `/dashboard` (or appropriate page)
- [ ] User's name/email is displayed in UI
- [ ] No console errors

### Common Issues

- **"Invalid credentials"**: Verify email confirmation was completed
- **Infinite redirect loop**: Check middleware logic in `src/middleware.ts`
- **Session not persisting**: Check cookies in DevTools → Application → Cookies

---

## Test 4: Session Persistence 🔄

**Goal**: Verify user sessions persist across page refreshes

### Steps

1. Ensure you're logged in from Test 3
2. Refresh the page (F5 or Cmd+R)
3. Wait for page to reload

### Success Criteria

- [ ] User remains logged in after refresh
- [ ] No redirect to login page
- [ ] User data still displayed correctly
- [ ] Auth cookies are present in DevTools → Application → Cookies
  - Look for `sb-access-token` and `sb-refresh-token`

### Common Issues

- **Logged out after refresh**: Check cookie settings (Secure, SameSite)
- **Cookies not set**: Check Supabase auth configuration
- **Token expired**: Check token expiration settings in Supabase

---

## Test 5: Protected Route Access 🚫

**Goal**: Verify unauthenticated users cannot access protected routes

### Steps

1. Log out (click logout button or clear cookies)
2. Try to access protected route directly: `https://your-domain.com/dashboard`

### Success Criteria

- [ ] User is redirected to `/login`
- [ ] Redirect URL parameter is preserved: `/login?redirect=/dashboard`
- [ ] After logging in, user is redirected back to `/dashboard`
- [ ] No console errors

### Common Issues

- **Protected route accessible without auth**: Check middleware in `src/middleware.ts`
- **No redirect to login**: Verify middleware matcher config
- **Redirect loop**: Check public routes list in middleware

---

## Test 6: Server-Protected Route Access 🔒

**Goal**: Verify server-side auth checks work in Server Components

### Steps

1. Log in as test user
2. Navigate to a page that uses server-side auth (e.g., `/dashboard`)
3. Verify user-specific data loads correctly
4. Open DevTools → Network tab
5. Log out
6. Try to access the same page again

### Success Criteria

- [ ] Logged-in user sees their data
- [ ] No unauthorized data is exposed
- [ ] Logged-out user is redirected to login
- [ ] No server errors in Vercel logs

### Common Issues

- **Data not loading**: Check server component implementation
- **Unauthorized access**: Verify `requireServerUser()` is used
- **Server errors**: Check Vercel function logs

---

## Test 7: Logout 👋

**Goal**: Verify users can log out successfully

### Steps

1. Ensure you're logged in
2. Click logout button
3. Observe behavior

### Success Criteria

- [ ] User is logged out successfully
- [ ] User is redirected to homepage or login page
- [ ] Auth cookies are cleared (check DevTools → Application → Cookies)
- [ ] Attempting to access protected routes redirects to login
- [ ] No console errors

### Common Issues

- **Still logged in after logout**: Check logout implementation
- **Cookies not cleared**: Verify cookie deletion logic
- **Redirect fails**: Check logout redirect URL

---

## Test 8: Database Query Functionality 📊

**Goal**: Verify database queries work correctly

### Steps

1. Log in as test user
2. Navigate to a page that displays database data (e.g., `/dashboard`)
3. Perform an action that writes to database (e.g., create a transaction, update profile)
4. Verify data is saved
5. Refresh page and verify data persists

### Success Criteria

- [ ] Data loads from database without errors
- [ ] Data is displayed correctly in UI
- [ ] Write operations succeed
- [ ] Data persists after refresh
- [ ] No database errors in Supabase logs

### Common Issues

- **Data not loading**: Check Supabase RLS policies
- **Write operations fail**: Verify RLS policies allow inserts/updates
- **Slow queries**: Check Supabase logs for query performance

---

## Test 9: Error Handling 🚨

**Goal**: Verify graceful error handling

### Steps

1. Trigger a known error condition (e.g., submit invalid form data)
2. Observe error message

### Success Criteria

- [ ] Error messages are user-friendly (no stack traces)
- [ ] Error messages don't expose sensitive information
- [ ] Application doesn't crash
- [ ] User can recover from error (e.g., fix form and resubmit)

### Common Issues

- **Stack traces visible**: Check error boundary implementation
- **Sensitive data exposed**: Review error message content
- **App crashes**: Add error boundaries to components

---

## Test 10: Performance Check ⚡

**Goal**: Verify acceptable performance

### Steps

1. Open DevTools → Network tab
2. Reload homepage
3. Note load times

### Success Criteria

- [ ] Initial page load < 3 seconds
- [ ] Time to Interactive (TTI) < 5 seconds
- [ ] No excessive network requests (< 50 requests)
- [ ] No large bundle sizes (main bundle < 500KB)

### Common Issues

- **Slow load times**: Check Vercel function cold start times
- **Large bundles**: Analyze bundle with `npm run build` and optimize
- **Many requests**: Implement request batching or caching

---

## Test Results Template

Use this template to record test results:

```
Deployment: [URL]
Date: [YYYY-MM-DD]
Tester: [Name]
Version/Commit: [Git commit hash]

Test Results:
[ ] Test 1: Homepage Load
[ ] Test 2: User Registration
[ ] Test 3: User Login
[ ] Test 4: Session Persistence
[ ] Test 5: Protected Route Access
[ ] Test 6: Server-Protected Route Access
[ ] Test 7: Logout
[ ] Test 8: Database Query Functionality
[ ] Test 9: Error Handling
[ ] Test 10: Performance Check

Issues Found:
- [Issue 1 description]
- [Issue 2 description]

Overall Status: PASS / FAIL
Notes: [Any additional observations]
```

---

## Automated Testing (Future Enhancement)

These smoke tests can be automated using:

- **Playwright**: End-to-end testing framework
- **Cypress**: Browser-based testing
- **Jest + Testing Library**: Component and integration tests

Consider automating these tests as the project matures to reduce manual testing burden.

---

## Rollback Criteria

If any of these critical tests fail, consider rolling back the deployment:

- ❌ Test 1 (Homepage Load) fails
- ❌ Test 3 (User Login) fails
- ❌ Test 4 (Session Persistence) fails
- ❌ Test 5 (Protected Route Access) fails

For non-critical failures, create a bug ticket and fix in the next deployment.

---

## Post-Test Cleanup

After completing smoke tests:

1. Delete test user account from Supabase (Table Editor → profiles)
2. Clear test data from database (if applicable)
3. Document any issues found
4. Update this document if new tests are needed
