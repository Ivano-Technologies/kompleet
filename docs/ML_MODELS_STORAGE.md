# ML Models Storage - AWS S3 Integration

## Overview

KOMPLEET ML models are stored in AWS S3 and automatically downloaded on application startup. This approach resolves GitHub's 100MB file size limit while providing fast, reliable model distribution.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS S3 Bucket                          │
│              kompleet-ml-models (eu-west-1)                 │
│                                                             │
│  v1.0.0/                                                    │
│  ├── model.joblib (181.90 MB)                              │
│  ├── encoders.joblib (2.3 KB)                              │
│  └── metadata.json (403 B)                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS Download
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Application (.ml-models-cache/)                │
│                                                             │
│  model-v1.0.0.joblib                                        │
│  encoders-v1.0.0.joblib                                     │
│  metadata-v1.0.0.json                                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Load
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              ML Inference Service (Port 5000)               │
│                                                             │
│  POST /categorize - Transaction categorization              │
│  POST /batch-categorize - Batch processing                  │
│  GET  /health - Service health check                        │
└─────────────────────────────────────────────────────────────┘
```

---

## S3 Bucket Configuration

**Bucket Name:** `kompleet-ml-models`  
**Region:** `eu-west-1` (Ireland - closest to Nigeria)  
**Access:** Public read for model files  
**Versioning:** Enabled (recommended)  
**Encryption:** Server-side encryption enabled  

### Public Access Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::kompleet-ml-models/*"
    }
  ]
}
```

---

## Model URLs

**Base URL:** `https://kompleet-ml-models.s3.eu-west-1.amazonaws.com`

**Current Version (v1.0.0):**
- Model: `https://kompleet-ml-models.s3.eu-west-1.amazonaws.com/v1.0.0/model.joblib`
- Encoders: `https://kompleet-ml-models.s3.eu-west-1.amazonaws.com/v1.0.0/encoders.joblib`
- Metadata: `https://kompleet-ml-models.s3.eu-west-1.amazonaws.com/v1.0.0/metadata.json`

---

## How It Works

### 1. Application Startup

When the ML inference service starts (`ml-service/inference.py`):

1. Check if models exist in local cache (`.ml-models-cache/`)
2. If not cached, download from S3
3. Load models into memory
4. Start Flask API server

### 2. Model Caching

- **Cache Location:** `/home/ubuntu/kompleet-web/.ml-models-cache/`
- **Cache Strategy:** Download once, reuse until cleared
- **Cache Invalidation:** Manual (delete cache directory) or version change

### 3. Model Loading

```python
# ml-service/inference.py
MODEL_DIR = '/home/ubuntu/kompleet-web/.ml-models-cache'
MODEL_VERSION = 'v1.0.0'
S3_BASE_URL = 'https://kompleet-ml-models.s3.eu-west-1.amazonaws.com'

# Download if not cached
download_model_file(f'{MODEL_VERSION}/model.joblib', model_path)
download_model_file(f'{MODEL_VERSION}/encoders.joblib', encoder_path)
download_model_file(f'{MODEL_VERSION}/metadata.json', metadata_path)

# Load models
model = joblib.load(model_path)
encoders = joblib.load(encoder_path)
```

---

## Uploading New Models

### Prerequisites

- AWS CLI installed or AWS SDK for Node.js
- IAM user with S3 write permissions
- Access Key ID and Secret Access Key

### Upload Script

Use the provided upload script:

```bash
cd /home/ubuntu/kompleet-web
npx tsx scripts/upload-models-to-s3.ts
```

The script will:
1. Check if bucket exists
2. Set public read policy
3. Upload all model files
4. Display public URLs

### Manual Upload (AWS Console)

1. Go to [S3 Console](https://s3.console.aws.amazon.com/s3/buckets/kompleet-ml-models)
2. Navigate to version folder (e.g., `v1.0.0/`)
3. Click **Upload**
4. Select files:
   - `model_1.0.0_YYYYMMDD_HHMMSS.joblib` → Upload as `model.joblib`
   - `encoders_1.0.0_YYYYMMDD_HHMMSS.joblib` → Upload as `encoders.joblib`
   - `metadata_1.0.0_YYYYMMDD_HHMMSS.json` → Upload as `metadata.json`
5. Set **Permissions** → **Grant public-read access**
6. Click **Upload**

---

## Deploying New Model Versions

### 1. Train New Model

```bash
cd ml-training
python train_model.py
```

This generates:
- `model_1.0.1_YYYYMMDD_HHMMSS.joblib`
- `encoders_1.0.1_YYYYMMDD_HHMMSS.joblib`
- `metadata_1.0.1_YYYYMMDD_HHMMSS.json`

### 2. Upload to S3

```bash
# Update version in upload script
# MODEL_VERSION = 'v1.0.1'

npx tsx scripts/upload-models-to-s3.ts
```

### 3. Update Application

Edit `ml-service/inference.py`:

```python
MODEL_VERSION = 'v1.0.1'  # Update version
```

### 4. Clear Cache and Restart

```bash
rm -rf .ml-models-cache/
# Restart ML service (will download new version)
```

---

## Troubleshooting

### Models Not Downloading

**Symptom:** ML service fails to start with "File not found" error

**Solutions:**
1. Check S3 bucket public access policy
2. Verify model URLs are accessible:
   ```bash
   curl -I https://kompleet-ml-models.s3.eu-west-1.amazonaws.com/v1.0.0/model.joblib
   ```
3. Check network connectivity
4. Verify S3 bucket name and region in code

### Slow Model Loading

**Symptom:** ML service takes >2 minutes to start

**Solutions:**
1. Check internet connection speed
2. Consider using CloudFront CDN for faster downloads
3. Verify cache directory is writable
4. Use smaller model files (compress or reduce features)

### Cache Not Working

**Symptom:** Models re-download on every restart

**Solutions:**
1. Check cache directory permissions:
   ```bash
   ls -la .ml-models-cache/
   ```
2. Verify cache path in code matches actual directory
3. Ensure sufficient disk space

### S3 Access Denied

**Symptom:** 403 Forbidden error when downloading

**Solutions:**
1. Check bucket policy allows public read
2. Verify bucket name and region are correct
3. Check if bucket has "Block Public Access" enabled (should be disabled)

---

## Cost Estimation

### AWS S3 Costs (eu-west-1)

**Storage:**
- 182 MB model + 3 KB encoders + 403 B metadata ≈ 0.18 GB
- Cost: $0.023/GB/month = **$0.004/month**

**Data Transfer:**
- Assuming 100 downloads/month (dev + prod deployments)
- 100 × 182 MB = 18.2 GB
- First 100 GB free per month
- Cost: **$0.00/month**

**Total Monthly Cost:** ~**$0.00** (within free tier)

---

## Security Considerations

### Public Access

- ✅ Models contain no sensitive data (only trained weights)
- ✅ Public read access is safe for ML models
- ✅ Write access restricted to IAM user only

### IAM User Permissions

**Recommended Policy** (least privilege):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::kompleet-ml-models",
        "arn:aws:s3:::kompleet-ml-models/*"
      ]
    }
  ]
}
```

### Credential Management

- ❌ Never commit AWS credentials to git
- ✅ Use environment variables for credentials
- ✅ Rotate access keys every 90 days
- ✅ Delete IAM user after initial upload (optional)

---

## Monitoring

### S3 Metrics (CloudWatch)

Monitor in AWS Console:
- **BucketSizeBytes** - Total storage used
- **NumberOfObjects** - Number of files
- **AllRequests** - Download requests
- **4xxErrors** - Access denied errors
- **5xxErrors** - S3 service errors

### Application Metrics

Log in ML service:
- Model download time
- Model load time
- Cache hit/miss rate
- Inference latency

---

## Alternative Solutions Considered

### 1. Git LFS (Large File Storage)

**Pros:** Integrated with Git workflow  
**Cons:** $5/month for 50GB bandwidth, complex setup  
**Decision:** ❌ Not cost-effective for small team

### 2. Supabase Storage

**Pros:** Already using Supabase, simple integration  
**Cons:** 50MB file limit on free tier, 182MB model exceeds limit  
**Decision:** ❌ File too large

### 3. GitHub Releases

**Pros:** Free, integrated with GitHub  
**Cons:** Manual upload, no CDN, slower downloads  
**Decision:** ❌ Not automated enough

### 4. AWS S3 (Selected)

**Pros:** Free tier covers usage, fast CDN, reliable, scalable  
**Cons:** Requires AWS account setup  
**Decision:** ✅ **Best balance of cost, performance, and reliability**

---

## Future Improvements

1. **CloudFront CDN** - Add CDN for faster global downloads
2. **Model Compression** - Reduce model size with quantization
3. **Lazy Loading** - Load model on first inference request
4. **Model Registry** - Track model versions in database
5. **A/B Testing** - Deploy multiple model versions simultaneously
6. **Automated Uploads** - CI/CD pipeline uploads models after training

---

## References

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [Joblib Documentation](https://joblib.readthedocs.io/)
- [Flask Documentation](https://flask.palletsprojects.com/)

---

**Last Updated:** February 6, 2026  
**Model Version:** v1.0.0  
**Maintainer:** KOMPLEET Engineering Team
