import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const AWS_ACCESS_KEY_ID = "AKIAUB7KGSIPWMQ6M3MN";
const AWS_SECRET_ACCESS_KEY = "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";
const AWS_REGION = "eu-west-1";
const BUCKET_NAME = "kompleet-ml-models";

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const MODEL_VERSION = "v1.0.0";

async function checkBucket() {
  console.log(`Checking if bucket "${BUCKET_NAME}" exists...`);

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log(`✅ Bucket "${BUCKET_NAME}" exists\n`);
    return true;
  } catch (error: any) {
    if (error.name === "NotFound") {
      console.log(`⚠️  Bucket "${BUCKET_NAME}" not found\n`);
      return false;
    }
    throw error;
  }
}

async function setBucketPolicy() {
  console.log("Setting bucket policy for public read access...");

  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicReadGetObject",
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
      },
    ],
  };

  try {
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify(policy),
      }),
    );
    console.log("✅ Bucket policy set successfully\n");
  } catch (error) {
    console.error("❌ Error setting bucket policy:", error);
    console.log(
      "⚠️  You may need to manually enable public access in AWS Console\n",
    );
  }
}

async function uploadFile(localPath: string, s3Key: string) {
  console.log(`Uploading ${path.basename(localPath)}...`);

  const fileBuffer = fs.readFileSync(localPath);
  const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
  console.log(`  File size: ${fileSizeMB} MB`);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: "application/octet-stream",
    CacheControl: "max-age=31536000", // 1 year
  });

  try {
    await s3Client.send(command);

    const publicUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;

    console.log(`  ✅ Uploaded successfully`);
    console.log(`  📍 Public URL: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error(`  ❌ Error uploading ${path.basename(localPath)}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log("🚀 Starting ML models upload to AWS S3\n");
    console.log(`Bucket: ${BUCKET_NAME}`);
    console.log(`Region: ${AWS_REGION}\n`);

    // Step 1: Check bucket exists
    const bucketExists = await checkBucket();

    if (!bucketExists) {
      console.log(
        "❌ Bucket does not exist. Please create it in AWS Console first.",
      );
      process.exit(1);
    }

    // Step 2: Set bucket policy for public read
    await setBucketPolicy();

    // Step 3: Upload model files
    const modelsDir = path.join(process.cwd(), "ml-training/models");

    const files = [
      {
        local: path.join(modelsDir, "model_1.0.0_20260206_051815.joblib"),
        s3Key: `${MODEL_VERSION}/model.joblib`,
      },
      {
        local: path.join(modelsDir, "encoders_1.0.0_20260206_051815.joblib"),
        s3Key: `${MODEL_VERSION}/encoders.joblib`,
      },
      {
        local: path.join(modelsDir, "metadata_1.0.0_20260206_051815.json"),
        s3Key: `${MODEL_VERSION}/metadata.json`,
      },
    ];

    const urls: Record<string, string> = {};

    for (const file of files) {
      if (!fs.existsSync(file.local)) {
        console.log(`⚠️  File not found: ${file.local}`);
        continue;
      }

      const url = await uploadFile(file.local, file.s3Key);
      urls[path.basename(file.s3Key)] = url;
      console.log("");
    }

    // Step 4: Summary
    console.log("✅ Upload complete!\n");
    console.log("📋 Model URLs:");
    Object.entries(urls).forEach(([name, url]) => {
      console.log(`  ${name}:`);
      console.log(`    ${url}`);
    });

    console.log("\n💡 Next steps:");
    console.log("  1. Update application code to download models from S3");
    console.log("  2. Add model download to build/startup process");
    console.log("  3. Test model download and inference");
    console.log("  4. (Optional) Delete IAM user for extra security");
  } catch (error) {
    console.error("\n❌ Upload failed:", error);
    process.exit(1);
  }
}

main();
