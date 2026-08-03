import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `❌ Missing required environment variable: ${name}\n` +
        `   Export it before running this script. Never hard-code credentials —\n` +
        `   this repository is public and is scanned for secrets in CI.`,
    );
    process.exit(1);
  }
  return value;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BUCKET_NAME = "ml-models";
const MODEL_VERSION = "v1.0.0";

async function createBucket() {
  console.log(`Creating bucket: ${BUCKET_NAME}...`);

  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    console.error("Error listing buckets:", listError);
    throw listError;
  }

  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (bucketExists) {
    console.log(`✅ Bucket "${BUCKET_NAME}" already exists`);
    return;
  }

  const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 200 * 1024 * 1024, // 200 MB
  });

  if (error) {
    console.error("Error creating bucket:", error);
    throw error;
  }

  console.log(`✅ Bucket "${BUCKET_NAME}" created successfully`);
}

async function uploadFile(localPath: string, storagePath: string) {
  console.log(`Uploading ${path.basename(localPath)}...`);

  const fileBuffer = fs.readFileSync(localPath);
  const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
  console.log(`  File size: ${fileSizeMB} MB`);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: "application/octet-stream",
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    console.error(`  ❌ Error uploading ${path.basename(localPath)}:`, error);
    throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  console.log(`  ✅ Uploaded successfully`);
  console.log(`  📍 Public URL: ${urlData.publicUrl}`);

  return urlData.publicUrl;
}

async function main() {
  try {
    console.log("🚀 Starting ML models upload to Supabase Storage\n");

    // Step 1: Create bucket
    await createBucket();
    console.log("");

    // Step 2: Upload model files
    const modelsDir = path.join(process.cwd(), "ml-training/models");

    const files = [
      {
        local: path.join(modelsDir, "model_1.0.0_20260206_051815.joblib"),
        storage: `${MODEL_VERSION}/model.joblib`,
      },
      {
        local: path.join(modelsDir, "encoders_1.0.0_20260206_051815.joblib"),
        storage: `${MODEL_VERSION}/encoders.joblib`,
      },
      {
        local: path.join(modelsDir, "metadata_1.0.0_20260206_051815.json"),
        storage: `${MODEL_VERSION}/metadata.json`,
      },
    ];

    const urls: Record<string, string> = {};

    for (const file of files) {
      if (!fs.existsSync(file.local)) {
        console.log(`⚠️  File not found: ${file.local}`);
        continue;
      }

      const url = await uploadFile(file.local, file.storage);
      urls[path.basename(file.storage)] = url;
      console.log("");
    }

    // Step 3: Summary
    console.log("✅ Upload complete!\n");
    console.log("📋 Model URLs:");
    Object.entries(urls).forEach(([name, url]) => {
      console.log(`  ${name}: ${url}`);
    });

    console.log("\n💡 Next steps:");
    console.log(
      "  1. Update application code to download models from Supabase",
    );
    console.log("  2. Add model download to build/startup process");
    console.log("  3. Test model download and inference");
  } catch (error) {
    console.error("\n❌ Upload failed:", error);
    process.exit(1);
  }
}

main();
