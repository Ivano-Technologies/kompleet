# Environment Variables Setup Guide

## Quick Start

### For Local Development

1. **Copy the template:**
   ```bash
   cp .env.local.template .env.local
   ```

2. **Fill in your credentials:**
   - Open `.env.local` in your editor
   - Replace all placeholder values with your actual credentials
   - See sections below for where to get each credential

3. **Start the development server:**
   ```bash
   pnpm dev
   ```

---

## Required Credentials

### 1. Supabase (Database & Auth)

**Where to get:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**

**Required values:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2. OpenAI (LLM Categorization & PDF Parsing)

**Where to get:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key

**Required values:**
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

**Cost estimate:**
- ~$0.01-0.05 per transaction categorization
- ~$0.10-0.50 per PDF parsing with LLM

---

### 3. ML Service (Optional but Recommended)

**Setup options:**

#### Option A: Local ML Service (Development)
```bash
# In a separate terminal
cd ml-service
pip install -r requirements.txt
python app.py

# In .env.local
ML_SERVICE_URL=http://localhost:5000
```

#### Option B: Deployed ML Service (Production)
```bash
# Deploy ML service to your hosting platform
# Then set:
ML_SERVICE_URL=https://ml-service.your-domain.com
```

#### Option C: Skip ML Service (Testing Only)
```bash
# Ensemble will skip ML and use LLM + Rules only
ML_SERVICE_URL=http://localhost:5000
# Just don't start the ML service
```

---

### 4. Mono Connect (Bank Statement Import)

**Where to get:**
1. Go to https://app.mono.co/
2. Sign up or log in
3. Go to **Settings** → **API Keys**

**Required values:**
```bash
# Development (test mode)
MONO_SECRET_KEY=test_sk_xxxxxxxxxxxxx
NEXT_PUBLIC_MONO_PUBLIC_KEY=test_pk_xxxxxxxxxxxxx

# Production (live mode)
MONO_SECRET_KEY=live_sk_xxxxxxxxxxxxx
NEXT_PUBLIC_MONO_PUBLIC_KEY=live_pk_xxxxxxxxxxxxx
```

---

### 5. Paystack (Payments - Optional)

**Where to get:**
1. Go to https://dashboard.paystack.com/
2. Go to **Settings** → **API Keys & Webhooks**

**Required values:**
```bash
# Development (test mode)
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx

# Production (live mode)
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
```

---

## New Environment Variables (Feb 2026 Upgrade)

### ML Confidence Thresholds

Control when transactions are auto-categorized vs. require review:

```bash
# ML Service thresholds (0.0 to 1.0)
ML_AUTO_ACCEPT_THRESHOLD=0.80    # 80%+ confidence = auto-accept
ML_SUGGEST_THRESHOLD=0.50        # 50%+ confidence = suggest to user

# LLM thresholds (0 to 100)
LLM_AUTO_ACCEPT_THRESHOLD=80     # 80+ confidence = auto-accept
LLM_SUGGEST_THRESHOLD=50         # 50+ confidence = suggest to user
```

**Recommended settings:**

| Environment | ML_AUTO | ML_SUGGEST | LLM_AUTO | LLM_SUGGEST |
|-------------|---------|------------|----------|-------------|
| **Development** | 0.90 | 0.60 | 90 | 60 |
| **Staging** | 0.85 | 0.55 | 85 | 55 |
| **Production** | 0.80 | 0.50 | 80 | 50 |

**Impact:**
- **Higher thresholds** = More conservative, fewer auto-categorizations, more manual reviews
- **Lower thresholds** = More aggressive, more auto-categorizations, fewer manual reviews

---

### Duplicate Detection Threshold

Control how similar transactions must be to be considered duplicates:

```bash
DUPLICATE_SIMILARITY_THRESHOLD=0.85  # 85% similarity required
```

**Recommended settings:**

| Environment | Threshold | Behavior |
|-------------|-----------|----------|
| **Development** | 0.90 | Strict (fewer false positives) |
| **Staging** | 0.85 | Balanced |
| **Production** | 0.85 | Balanced |

**Impact:**
- **Higher threshold (0.90)** = Stricter, catches only very similar transactions
- **Lower threshold (0.80)** = Looser, catches more potential duplicates but may have false positives

---

### Feature Flags

Enable or disable new features:

```bash
# PDF OCR for scanned documents
ENABLE_PDF_OCR=true

# LSH optimization for duplicate detection (faster for large datasets)
ENABLE_LSH_OPTIMIZATION=true

# Ensemble categorization (LLM → Rule → ML fallback)
ENABLE_ENSEMBLE_CATEGORIZATION=true

# Data quality monitoring and reporting
ENABLE_QUALITY_MONITORING=true
```

**Recommended settings:**

| Environment | OCR | LSH | Ensemble | Monitoring |
|-------------|-----|-----|----------|------------|
| **Development** | true | true | true | true |
| **Staging** | true | true | true | true |
| **Production** | true | true | true | true |

---

## Environment-Specific Configurations

### Development (.env.local)

```bash
NODE_ENV=development
LOG_LEVEL=info
ML_AUTO_ACCEPT_THRESHOLD=0.90  # More conservative
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

### Staging (.env.staging)

```bash
NODE_ENV=production
LOG_LEVEL=info
ML_AUTO_ACCEPT_THRESHOLD=0.85  # Balanced
RATE_LIMIT_REQUESTS_PER_MINUTE=45
```

### Production (.env.production)

```bash
NODE_ENV=production
LOG_LEVEL=warn  # Less verbose
ML_AUTO_ACCEPT_THRESHOLD=0.80  # More aggressive
RATE_LIMIT_REQUESTS_PER_MINUTE=30  # Stricter
```

---

## Vercel Deployment

### Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable with appropriate values for each environment:
   - **Production** - Used for production deployments
   - **Preview** - Used for preview deployments (staging)
   - **Development** - Used for local development

### Important Notes

- **Never commit** `.env.local` or any file with real credentials
- Use **different API keys** for development, staging, and production
- Set **stricter rate limits** in production
- Enable **all monitoring** in production
- Use **test mode keys** for payment providers in development

---

## Testing Your Configuration

### 1. Test Database Connection

```bash
pnpm dev
# Visit http://localhost:3000
# Try to sign up or log in
```

### 2. Test AI Categorization

```bash
# Upload a bank statement CSV
# Check if transactions are categorized
# Review confidence scores
```

### 3. Test ML Service (if enabled)

```bash
curl -X POST http://localhost:5000/health
# Should return: {"status": "healthy"}

curl -X POST http://localhost:5000/categorize \
  -H "Content-Type: application/json" \
  -d '{"merchant": "Shoprite", "amount": 5000}'
# Should return categorization result
```

### 4. Test PDF Parsing

```bash
# Upload a PDF bank statement
# Check if transactions are extracted
# Verify OCR fallback works for scanned PDFs
```

### 5. Test Quality Monitoring

```typescript
import { qualityMonitor } from '@/lib/services/data-quality-service';

// After processing transactions
console.log(qualityMonitor.generateReport());
```

---

## Troubleshooting

### Issue: "Supabase connection failed"

**Solution:**
1. Check if `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
3. Ensure Supabase project is not paused

### Issue: "OpenAI API error"

**Solution:**
1. Verify `OPENAI_API_KEY` is correct and active
2. Check if you have sufficient credits
3. Ensure API key has required permissions

### Issue: "ML service not responding"

**Solution:**
1. Check if ML service is running: `curl http://localhost:5000/health`
2. Verify `ML_SERVICE_URL` is correct
3. Check ML service logs for errors

### Issue: "Transactions not auto-categorizing"

**Solution:**
1. Check confidence thresholds are not too high
2. Verify `ENABLE_ENSEMBLE_CATEGORIZATION=true`
3. Check quality monitoring report for confidence scores

---

## Security Best Practices

1. **Never commit** `.env.local` or any file with real secrets
2. **Use different keys** for development, staging, and production
3. **Rotate API keys** regularly (every 90 days)
4. **Use environment variables** in hosting platforms, not hardcoded values
5. **Enable 2FA** on all service accounts (Supabase, OpenAI, etc.)
6. **Monitor API usage** to detect unauthorized access
7. **Set up alerts** for unusual activity

---

## Next Steps

1. ✅ Copy `.env.local.template` to `.env.local`
2. ✅ Fill in all required credentials
3. ✅ Test local development setup
4. ✅ Configure staging environment
5. ✅ Set up production environment variables
6. ✅ Deploy to staging and test
7. ✅ Deploy to production with monitoring

---

**For more details, see:**
- `KOMPLEET_UPGRADE_SUMMARY.md` - Complete implementation details
- `KOMPLEET_QUICK_REFERENCE.md` - Quick start guide
- `.env.example` - All available environment variables
