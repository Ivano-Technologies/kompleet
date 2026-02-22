# Custom Email Templates for KOMPLEET

## Overview

This guide explains how to configure custom email templates in Supabase so that authentication emails (signup confirmation, password reset, etc.) are branded with KOMPLEET instead of showing "Supabase Auth".

## Current Issue

Currently, users receive emails from:

- **Sender:** `Supabase Auth <noreply@mail.app.supabase.io>`
- **Branding:** Generic Supabase branding
- **User Experience:** Confusing - users expect emails from KOMPLEET

## Solution: Custom Email Templates

Supabase allows you to customize email templates with your own branding, sender name, and content.

## Step-by-Step Configuration

### 1. Access Email Templates

1. Go to **Supabase Dashboard** → Your Project (KOMPLEET)
2. Navigate to **Authentication** → **Email Templates**
3. You'll see templates for:
   - Confirm signup
   - Invite user
   - Magic Link
   - Change Email Address
   - Reset Password

### 2. Customize "Confirm Signup" Template

Click on **"Confirm signup"** and replace with:

```html
<h2>Welcome to KOMPLEET!</h2>

<p>Hi there,</p>

<p>
  Thank you for signing up for KOMPLEET - your Nigerian Tax Compliance Platform.
</p>

<p>
  To complete your registration and start using our tax calculators, please
  confirm your email address by clicking the button below:
</p>

<p>
  <a
    href="{{ .ConfirmationURL }}"
    style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;"
    >Confirm Email Address</a
  >
</p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 24 hours.</p>

<hr />

<p><strong>What you can do with KOMPLEET:</strong></p>
<ul>
  <li>Calculate Business Tax based on Nigeria Tax Act 2025</li>
  <li>Calculate Individual Income Tax with accurate rates</li>
  <li>Compute VAT, Stamp Duty, and Property Tax</li>
  <li>Export calculations as professional PDFs</li>
  <li>Track your calculation history</li>
</ul>

<hr />

<p>
  If you didn't create an account with KOMPLEET, you can safely ignore this
  email.
</p>

<p>
  Best regards,<br />
  <strong>The KOMPLEET Team</strong><br />
  Ivano Technologies Ltd
</p>

<p style="font-size: 12px; color: #666;">
  This is an automated email from KOMPLEET. Please do not reply to this email.
</p>
```

### 3. Customize "Reset Password" Template

Click on **"Reset Password"** and replace with:

```html
<h2>Reset Your KOMPLEET Password</h2>

<p>Hi there,</p>

<p>We received a request to reset the password for your KOMPLEET account.</p>

<p>To reset your password, click the button below:</p>

<p>
  <a
    href="{{ .ConfirmationURL }}"
    style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;"
    >Reset Password</a
  >
</p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 1 hour.</p>

<hr />

<p><strong>Security Notice:</strong></p>
<ul>
  <li>If you didn't request a password reset, please ignore this email</li>
  <li>Your password will not change until you create a new one</li>
  <li>Never share your password with anyone</li>
</ul>

<hr />

<p>
  If you're having trouble accessing your account, please contact our support
  team.
</p>

<p>
  Best regards,<br />
  <strong>The KOMPLEET Team</strong><br />
  Ivano Technologies Ltd
</p>

<p style="font-size: 12px; color: #666;">
  This is an automated email from KOMPLEET. Please do not reply to this email.
</p>
```

### 4. Customize "Magic Link" Template (Optional)

Click on **"Magic Link"** and replace with:

```html
<h2>Sign in to KOMPLEET</h2>

<p>Hi there,</p>

<p>Click the button below to sign in to your KOMPLEET account:</p>

<p>
  <a
    href="{{ .ConfirmationURL }}"
    style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;"
    >Sign In</a
  >
</p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 1 hour.</p>

<hr />

<p>
  If you didn't request this sign-in link, you can safely ignore this email.
</p>

<p>
  Best regards,<br />
  <strong>The KOMPLEET Team</strong><br />
  Ivano Technologies Ltd
</p>

<p style="font-size: 12px; color: #666;">
  This is an automated email from KOMPLEET. Please do not reply to this email.
</p>
```

### 5. Configure SMTP Settings (Advanced - Optional)

For complete branding, you can configure custom SMTP to send from your own domain (e.g., `noreply@kompleet.ng`):

1. Go to **Authentication** → **Email Settings**
2. Enable **Custom SMTP**
3. Configure your SMTP provider (e.g., SendGrid, AWS SES, Mailgun):
   - **Host:** smtp.sendgrid.net (or your provider)
   - **Port:** 587
   - **Username:** Your SMTP username
   - **Password:** Your SMTP password
   - **Sender Email:** noreply@kompleet.ng
   - **Sender Name:** KOMPLEET

**Recommended SMTP Providers:**

- **SendGrid** - Free tier: 100 emails/day
- **AWS SES** - $0.10 per 1,000 emails
- **Mailgun** - Free tier: 5,000 emails/month
- **Postmark** - Free tier: 100 emails/month

### 6. Test Email Templates

After customizing templates:

1. Create a test user account
2. Verify the email looks correct
3. Check that links work properly
4. Ensure branding is consistent

## Template Variables

Supabase provides these variables you can use in templates:

- `{{ .ConfirmationURL }}` - The confirmation/reset link
- `{{ .Token }}` - The confirmation token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address

## Styling Guidelines

**Colors:**

- Primary Green: `#10b981` (KOMPLEET brand color)
- Text: `#333333`
- Muted Text: `#666666`
- Background: `#f9fafb`

**Fonts:**

- Use system fonts for email compatibility
- Keep font sizes readable (14px minimum)

**Layout:**

- Keep width under 600px for mobile compatibility
- Use inline CSS (email clients don't support `<style>` tags well)
- Test on multiple email clients (Gmail, Outlook, Apple Mail)

## Email Deliverability Tips

1. **SPF/DKIM Records** - Configure if using custom SMTP
2. **Avoid Spam Words** - Don't use "free", "urgent", "click here"
3. **Plain Text Alternative** - Supabase auto-generates this
4. **Unsubscribe Link** - Not needed for transactional emails
5. **Test Before Launch** - Send test emails to yourself

## Monitoring

After deployment, monitor:

- Email delivery rates
- User complaints about not receiving emails
- Spam folder issues

## Next Steps

1. ✅ Customize email templates in Supabase Dashboard
2. ✅ Test with a new user signup
3. ✅ Test password reset flow
4. ⏳ (Optional) Set up custom SMTP for domain-based emails
5. ⏳ (Optional) Purchase domain (kompleet.ng) for professional emails

## Support

If emails aren't being delivered:

- Check Supabase logs: Dashboard → Logs → Auth Logs
- Verify email isn't in spam folder
- Check Supabase email rate limits (free tier: 4 emails/hour)
- Consider upgrading to Pro plan for higher limits

## References

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Email Design Best Practices](https://www.campaignmonitor.com/dev-resources/guides/email-design/)
