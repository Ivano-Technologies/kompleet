# Google OAuth Verification Guide for KOMPLEET Platform

## Date: February 06, 2026
## Company: Ivano Technologies Ltd
## Verified Domain: techivano.com

---

## Overview

This guide will help you get KOMPLEET Platform verified by Google Cloud so that users see a trusted OAuth consent screen when signing in with Google, instead of the "unverified app" warning.

**Verification Timeline**: 2-3 business days after submission

---

## ✅ Current Status Checklist

### What You Already Have:
- ✅ **Privacy Policy**: https://kompleet-platform-33sgybk1y-techivano.vercel.app/privacy
- ✅ **Terms of Service**: https://kompleet-platform-33sgybk1y-techivano.vercel.app/terms
- ✅ **Verified Domain**: techivano.com
- ✅ **Professional Email**: support@techivano.com, privacy@techivano.com
- ✅ **Company**: Ivano Technologies Ltd (Nigeria)

### What Needs to Be Done:
- ⚠️ **Host Privacy Policy on verified domain**: https://techivano.com/kompleet/privacy
- ⚠️ **Host Terms of Service on verified domain**: https://techivano.com/kompleet/terms
- ⚠️ **Create App Homepage on verified domain**: https://techivano.com/kompleet
- ⚠️ **Verify domain ownership in Google Search Console**
- ⚠️ **Configure OAuth consent screen in Google Cloud Console**
- ⚠️ **Submit for verification**

---

## Step-by-Step Verification Process

### STEP 1: Verify Domain Ownership in Google Search Console

1. **Go to Google Search Console**: https://search.google.com/search-console
2. **Add property**: Click "Add Property" and enter `techivano.com`
3. **Verify ownership** using one of these methods:
   - **DNS verification** (Recommended): Add TXT record to your domain DNS
   - **HTML file upload**: Upload verification file to your website root
   - **HTML meta tag**: Add meta tag to your homepage
   - **Google Analytics**: Use existing GA tracking code
   - **Google Tag Manager**: Use existing GTM container

4. **Important**: The Google Account you use for verification MUST be an **Owner** of the Google Cloud project where your OAuth credentials are configured.

---

### STEP 2: Host Required Pages on Verified Domain

Google requires all OAuth-related pages to be hosted on your verified domain (techivano.com).

#### Option A: Create KOMPLEET Subdirectory on techivano.com

Create these pages on your main website:
- `https://techivano.com/kompleet` - App homepage
- `https://techivano.com/kompleet/privacy` - Privacy policy
- `https://techivano.com/kompleet/terms` - Terms of service

#### Option B: Use Subdomain (if you prefer)

If you want to use a subdomain like `kompleet.techivano.com`:
1. Set up the subdomain in your DNS
2. Deploy KOMPLEET to that subdomain
3. Verify the subdomain in Google Search Console (techivano.com verification should cover it)

**Recommended**: Option A is simpler and faster for verification.

---

### STEP 3: Create App Homepage Content

Create a landing page at `https://techivano.com/kompleet` with:

**Required Elements:**
1. **App Name**: KOMPLEET
2. **App Logo**: 120x120px minimum (current logo works)
3. **Description**: Clear explanation of what KOMPLEET does
4. **OAuth Usage Explanation**: Why Google sign-in is used
5. **Links to Privacy Policy and Terms**
6. **Support Contact**: support@techivano.com

**Sample Content** (see next section for full HTML)

---

### STEP 4: Configure OAuth Consent Screen

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Select your project**: The project containing your OAuth credentials
3. **Navigate to**: APIs & Services → OAuth consent screen
4. **Fill in the following fields**:

#### **App Information**
- **App name**: KOMPLEET
- **User support email**: support@techivano.com
- **App logo**: Upload KOMPLEET logo (120x120px minimum)

#### **App Domain**
- **Application home page**: `https://techivano.com/kompleet`
- **Application privacy policy link**: `https://techivano.com/kompleet/privacy`
- **Application terms of service link**: `https://techivano.com/kompleet/terms`

#### **Authorized Domains**
Add these domains:
- `techivano.com`
- `vercel.app` (for your current deployment)

#### **Developer Contact Information**
- **Email addresses**: privacy@techivano.com, support@techivano.com

#### **Scopes**
Declare only the scopes you actually use:
- `openid` - Required for Google Sign-In
- `email` - To get user's email address
- `profile` - To get user's name and profile picture

**Do NOT** request sensitive or restricted scopes unless absolutely necessary, as they require additional verification.

---

### STEP 5: Submit for Verification

1. **Review all information** on the OAuth consent screen
2. **Click "Save and Continue"** through all steps
3. **On the final screen**, click **"Submit for Verification"**
4. **Fill out the verification form**:
   - **App description**: "KOMPLEET is a Nigerian tax compliance platform that helps individuals and businesses calculate taxes, generate reports, and comply with Nigerian tax laws."
   - **Why do you need Google user data?**: "We use Google Sign-In to provide a secure and convenient authentication method. We only access the user's email and name to create their account and personalize their experience."
   - **Links to documentation**: Provide links to your privacy policy and terms of service
   - **YouTube video** (optional but recommended): A 1-2 minute video showing how users sign in with Google and what data is accessed

5. **Submit** and wait for Google's review

---

## Sample App Homepage HTML

Create this page at `https://techivano.com/kompleet`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KOMPLEET - Nigerian Tax Compliance Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f9fafb;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        header {
            text-align: center;
            padding: 60px 20px;
            background: linear-gradient(135deg, #0a7ea4 0%, #0d9488 100%);
            color: white;
            border-radius: 16px;
            margin-bottom: 60px;
        }
        .logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 20px;
            background: white;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        .tagline { font-size: 1.3em; opacity: 0.95; }
        .section {
            background: white;
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        h2 {
            color: #0a7ea4;
            margin-bottom: 20px;
            font-size: 2em;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin: 30px 0;
        }
        .feature {
            padding: 20px;
            border-left: 4px solid #0a7ea4;
            background: #f0f9ff;
        }
        .feature h3 { color: #0a7ea4; margin-bottom: 10px; }
        .cta {
            text-align: center;
            padding: 40px;
        }
        .button {
            display: inline-block;
            padding: 15px 40px;
            background: #0a7ea4;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-size: 1.2em;
            font-weight: 600;
            transition: background 0.3s;
        }
        .button:hover { background: #0d9488; }
        .oauth-info {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 30px 0;
        }
        footer {
            text-align: center;
            padding: 40px 20px;
            color: #666;
            border-top: 1px solid #e5e7eb;
            margin-top: 60px;
        }
        footer a {
            color: #0a7ea4;
            text-decoration: none;
            margin: 0 15px;
        }
        footer a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">
                <!-- Add your KOMPLEET logo image here -->
                <img src="/path-to-logo.png" alt="KOMPLEET Logo" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <h1>KOMPLEET</h1>
            <p class="tagline">Nigerian Tax Compliance Made Simple</p>
        </header>

        <div class="section">
            <h2>About KOMPLEET</h2>
            <p style="font-size: 1.1em; margin-bottom: 20px;">
                KOMPLEET is a comprehensive tax compliance platform designed specifically for Nigerian individuals and businesses. 
                We help you navigate the complexities of Nigerian tax laws, calculate your obligations accurately, and generate 
                professional reports for regulatory compliance.
            </p>
            
            <div class="features">
                <div class="feature">
                    <h3>🧮 Tax Calculators</h3>
                    <p>Calculate business taxes, individual taxes, VAT, and capital allowances based on the Nigeria Tax Act 2025.</p>
                </div>
                <div class="feature">
                    <h3>📊 Professional Reports</h3>
                    <p>Generate detailed financial statements, tax summaries, and compliance documentation.</p>
                </div>
                <div class="feature">
                    <h3>📈 Transaction Management</h3>
                    <p>Import and categorize transactions, track income and expenses, and maintain accurate records.</p>
                </div>
                <div class="feature">
                    <h3>⏰ Deadline Tracking</h3>
                    <p>Never miss a filing deadline with automated reminders and a comprehensive tax calendar.</p>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Why We Use Google Sign-In</h2>
            <div class="oauth-info">
                <h3 style="margin-bottom: 10px;">🔐 Secure & Convenient Authentication</h3>
                <p>
                    KOMPLEET uses Google Sign-In to provide you with a secure, fast, and convenient way to access your account. 
                    When you sign in with Google, we only request access to your:
                </p>
                <ul style="margin: 15px 0 15px 30px;">
                    <li><strong>Email address</strong> - To create and identify your account</li>
                    <li><strong>Name</strong> - To personalize your experience</li>
                    <li><strong>Profile picture</strong> (optional) - To display on your account</li>
                </ul>
                <p>
                    <strong>We do NOT access:</strong> Your Google Drive, Gmail, Calendar, or any other Google services. 
                    We only use Google for authentication purposes.
                </p>
            </div>
        </div>

        <div class="section">
            <h2>Your Privacy & Data Security</h2>
            <p style="margin-bottom: 15px;">
                We take your privacy seriously. All your tax data and personal information are:
            </p>
            <ul style="margin-left: 30px; margin-bottom: 20px;">
                <li>Encrypted in transit and at rest</li>
                <li>Stored securely in compliance with Nigerian data protection laws</li>
                <li>Never shared with third parties without your consent</li>
                <li>Protected by industry-standard security measures</li>
            </ul>
            <p>
                For complete details, please read our 
                <a href="https://techivano.com/kompleet/privacy" style="color: #0a7ea4; font-weight: 600;">Privacy Policy</a> and 
                <a href="https://techivano.com/kompleet/terms" style="color: #0a7ea4; font-weight: 600;">Terms of Service</a>.
            </p>
        </div>

        <div class="cta">
            <h2 style="margin-bottom: 20px;">Ready to Simplify Your Tax Compliance?</h2>
            <a href="https://kompleet-platform-33sgybk1y-techivano.vercel.app/signup" class="button">
                Get Started Free
            </a>
            <p style="margin-top: 20px; color: #666;">
                Already have an account? 
                <a href="https://kompleet-platform-33sgybk1y-techivano.vercel.app/login" style="color: #0a7ea4; font-weight: 600;">Sign In</a>
            </p>
        </div>

        <footer>
            <p><strong>Ivano Technologies Ltd</strong></p>
            <p style="margin: 10px 0;">Nigerian Tax Compliance Solutions</p>
            <div>
                <a href="https://techivano.com/kompleet/privacy">Privacy Policy</a>
                <a href="https://techivano.com/kompleet/terms">Terms of Service</a>
                <a href="mailto:support@techivano.com">Contact Support</a>
            </div>
            <p style="margin-top: 20px; color: #999;">
                © 2026 Ivano Technologies Ltd. All rights reserved.
            </p>
        </footer>
    </div>
</body>
</html>
```

---

## Common Issues & Solutions

### Issue 1: "Domain not verified"
**Solution**: Ensure you've verified techivano.com in Google Search Console using the same Google Account that owns the Cloud project.

### Issue 2: "Privacy policy not accessible"
**Solution**: Make sure the privacy policy URL is publicly accessible (not behind login) and hosted on techivano.com.

### Issue 3: "Verification rejected - insufficient information"
**Solution**: Provide a detailed app description and consider adding a YouTube video demonstrating the OAuth flow.

### Issue 4: "Authorized domains mismatch"
**Solution**: Add ALL domains used in your OAuth flow:
- techivano.com (homepage, privacy, terms)
- vercel.app (redirect URIs)

---

## After Verification is Approved

Once Google approves your verification (2-3 business days):

1. ✅ **Users will see**: "KOMPLEET wants to access your Google Account" with your verified logo and name
2. ✅ **No more "unverified app" warning**
3. ✅ **Increased user trust and conversion rates**
4. ✅ **Professional OAuth consent screen**

### Important: Maintaining Verification

- **Don't change** app name, logo, or domain without resubmitting for verification
- **Keep** privacy policy and terms of service up-to-date
- **Respond promptly** to any emails from Google's Trust & Safety team
- **Renew** domain verification if it expires

---

## Quick Reference Checklist

Before submitting for verification, ensure:

- [ ] Domain techivano.com is verified in Google Search Console
- [ ] App homepage exists at https://techivano.com/kompleet
- [ ] Privacy policy is at https://techivano.com/kompleet/privacy
- [ ] Terms of service is at https://techivano.com/kompleet/terms
- [ ] All pages are publicly accessible (no login required)
- [ ] OAuth consent screen is fully configured
- [ ] Only necessary scopes are requested (openid, email, profile)
- [ ] Support email is professional (@techivano.com)
- [ ] App logo is uploaded (120x120px minimum)
- [ ] Developer contact information is current
- [ ] Authorized domains include techivano.com and vercel.app

---

## Support & Resources

### Google Documentation
- [OAuth Consent Screen Configuration](https://developers.google.com/workspace/guides/configure-oauth-consent)
- [Brand Verification Guide](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification)
- [Google Search Console](https://search.google.com/search-console)

### Contact
- **Email**: support@techivano.com
- **Privacy**: privacy@techivano.com

---

## Timeline Estimate

| Task | Estimated Time |
|------|----------------|
| Verify domain in Search Console | 15-30 minutes |
| Create app homepage | 1-2 hours |
| Host privacy/terms on domain | 30 minutes |
| Configure OAuth consent screen | 30 minutes |
| Submit for verification | 15 minutes |
| **Google's review process** | **2-3 business days** |
| **Total time to completion** | **3-4 days** |

---

**Good luck with your verification! Once approved, your users will have a much better experience signing in with Google.**
