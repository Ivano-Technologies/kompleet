# Resend Email Setup Guide

This guide walks you through setting up Resend for the KOMPLEET platform. Resend powers:

- **Contact form** — Sends submissions to hi@, help@, or support@ based on subject
- **Deadline reminders** — Tax filing reminders to users
- **Other transactional emails** — From `src/lib/email-service.ts`

---

## 1. Create a Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email address

---

## 2. Add and Verify Your Domain

Your app sends from `ivanotechnologies.com`. You must verify this domain in Resend.

1. In the Resend dashboard, go to **Domains** → **Add Domain**
2. Enter `ivanotechnologies.com`
3. Resend will show DNS records to add. You need:
   - **DKIM** (2–3 CNAME records) — Proves emails are from you
   - **SPF** (1 TXT record) — Authorizes Resend to send for your domain
   - **DMARC** (optional but recommended) — Reduces spoofing

4. Add these records in your DNS provider (e.g. Cloudflare, Namecheap, GoDaddy)
5. In Resend, click **Verify DNS Records**
6. Wait for status to show **Verified** (can take a few minutes to 48 hours)

**Tip:** Resend has provider-specific guides (Cloudflare, GoDaddy, etc.) if you need help.

---

## 3. Create an API Key

1. In Resend dashboard, go to **API Keys** → **Create API Key**
2. Name it (e.g. `kompleet-production`)
3. Copy the key — it starts with `re_` and is shown only once
4. Add to your environment:

```bash
# .env.local (development)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx

# Production: set in Vercel/Railway/etc. environment variables
```

---

## 4. Configure Environment

Add to `.env.local`:

```env
RESEND_API_KEY=re_your_api_key_here
```

Restart your dev server after adding the variable.

---

## 5. Sender Addresses Used by the App

| Purpose | From Address | Notes |
|---------|--------------|-------|
| Contact form | `noreply@ivanotechnologies.com` | Reply-To is set to the user's email |
| Deadline reminders | `noreply@ivanotechnologies.com` | Via email-service.ts |
| Other transactional | `noreply@ivanotechnologies.com` | Via email-service.ts |

Once your domain is verified, you can send from any `*@ivanotechnologies.com` address. No need to create each address separately in Resend.

---

## 6. Test the Setup

### Contact form

1. Start the app: `pnpm dev`
2. Go to `/contact`
3. Fill and submit the form
4. Check the recipient inbox (hi@, help@, or support@ depending on subject)

### Without API key (development)

If `RESEND_API_KEY` is not set, the app logs what *would* be sent instead of failing. Useful for local development without a key.

---

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Domain not verified" | Ensure all DNS records are added and propagated. Use `dig` or [mxtoolbox.com](https://mxtoolbox.com) to verify. |
| Emails go to spam | Add DMARC, ensure SPF/DKIM are correct. Warm up the domain by sending gradually. |
| 401 Unauthorized | Check that `RESEND_API_KEY` is correct and has no extra spaces. |
| Rate limit (429) | Resend allows 2 req/sec by default. Contact form is limited to 5/min per IP. |

---

## 8. Pricing

Resend has a free tier (e.g. 3,000 emails/month). Check [resend.com/pricing](https://resend.com/pricing) for current limits.
