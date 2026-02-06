# OAuth Branding Configuration Guide

## Issue
When users click "Continue with Google" on the KOMPLEET login page, they see "Sign in to continue to frlcvkmjuhnjcicwywrh.supabase.co" instead of "Sign in to continue to KOMPLEET".

## Root Cause
This is controlled by Supabase's OAuth configuration, not our application code. The OAuth consent screen shows the Supabase project URL by default.

## Solution Options

### Option 1: Custom Domain (Recommended for Production)
Configure a custom domain for your Supabase project to replace the default `.supabase.co` domain.

**Steps:**
1. Go to Supabase Dashboard → Project Settings → Custom Domains
2. Add your custom domain (e.g., `app.kompleet.ng` or `auth.kompleet.ng`)
3. Configure DNS records as instructed by Supabase
4. Wait for SSL certificate provisioning (5-10 minutes)
5. Update environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://app.kompleet.ng
   ```
6. Redeploy application

**Result:** OAuth consent screen will show "Sign in to continue to app.kompleet.ng"

### Option 2: Google Cloud Console Branding (Partial Fix)
Configure the OAuth consent screen in Google Cloud Console to show KOMPLEET branding.

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to APIs & Services → OAuth consent screen
4. Edit the consent screen:
   - **Application name:** KOMPLEET
   - **Application logo:** Upload KOMPLEET logo (120x120px minimum)
   - **Application home page:** https://kompleet.ng (or your domain)
   - **Application privacy policy:** https://kompleet.ng/privacy
   - **Application terms of service:** https://kompleet.ng/terms
   - **Authorized domains:** Add your custom domain
5. Save changes

**Result:** OAuth consent screen will show KOMPLEET branding, but the "continue to" URL will still show the Supabase domain unless you implement Option 1.

### Option 3: Supabase Project Settings (Minimal Impact)
Update Supabase project settings to improve branding.

**Steps:**
1. Go to Supabase Dashboard → Project Settings → General
2. Update **Project Name** to "KOMPLEET"
3. This has minimal impact on OAuth screens but helps with internal organization

## Recommended Approach for KOMPLEET

**For MVP/Beta Launch:**
- Implement **Option 2** (Google Cloud Console branding) immediately
- This takes 5-10 minutes and improves the OAuth experience
- Users will see "KOMPLEET" as the application name with the logo

**For Production Launch:**
- Implement **Option 1** (Custom Domain) before public launch
- This provides the most professional experience
- Budget 1-2 days for DNS propagation and testing

## Current Status

✅ **Application branding is correct:**
- Landing page shows KOMPLEET branding
- Login page shows KOMPLEET logo and tagline
- Sign up page shows KOMPLEET branding
- No "Supabase" references in the application UI

⚠️ **OAuth consent screen needs configuration:**
- Google OAuth shows Supabase project URL
- Requires Google Cloud Console configuration (Option 2)
- Or custom domain setup (Option 1)

## Action Items

### Immediate (Before Beta Launch)
- [ ] Configure Google Cloud Console OAuth consent screen with KOMPLEET branding
- [ ] Upload KOMPLEET logo to Google Cloud Console
- [ ] Add privacy policy and terms of service URLs
- [ ] Test OAuth flow with new branding

### Before Production Launch
- [ ] Set up custom domain for Supabase project
- [ ] Configure DNS records
- [ ] Update environment variables
- [ ] Redeploy application with custom domain
- [ ] Test OAuth flow with custom domain

## Testing Checklist

After implementing OAuth branding changes:

1. **Google OAuth Flow:**
   - [ ] Click "Continue with Google" on login page
   - [ ] Verify consent screen shows "KOMPLEET" as application name
   - [ ] Verify KOMPLEET logo is displayed
   - [ ] Verify privacy policy and terms links work
   - [ ] Complete sign-in and verify redirect to dashboard

2. **Magic Link Flow:**
   - [ ] Request magic link
   - [ ] Check email for branding
   - [ ] Verify email shows KOMPLEET branding (configured in Supabase Email Templates)

3. **Password Flow:**
   - [ ] Sign in with email/password
   - [ ] Verify no Supabase references in UI

## Additional Resources

- [Supabase Custom Domains Documentation](https://supabase.com/docs/guides/platform/custom-domains)
- [Google OAuth Consent Screen Configuration](https://support.google.com/cloud/answer/6158849)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

## Notes

- OAuth branding is controlled by the OAuth provider (Google, Microsoft, etc.), not by our application code
- Each OAuth provider has its own branding configuration process
- Custom domains provide the most professional experience but require DNS configuration
- Google Cloud Console branding is the quickest fix for immediate improvement
