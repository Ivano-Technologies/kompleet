import fs from 'fs';
import path from 'path';
import https from 'https';

const S3_BASE_URL = 'https://kompleet-ml-models.s3.eu-west-1.amazonaws.com';
const MODEL_VERSION = 'v1.0.0';
const CACHE_DIR = path.join(process.cwd(), '.ml-models-cache');

interface ModelFiles {
  model: string;
  encoders: string;
  metadata: string;
}

/**
 * Download a file from S3 to local cache
 */
async function downloadFile(url: string, localPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(localPath, () => {});
      reject(err);
    });
  });
}

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Download ML models from S3 if not already cached
 */
export async function downloadModels(version: string = MODEL_VERSION): Promise<ModelFiles> {
  ensureCacheDir();
  
  const files = {
    model: path.join(CACHE_DIR, `model-${version}.joblib`),
    encoders: path.join(CACHE_DIR, `encoders-${version}.joblib`),
    metadata: path.join(CACHE_DIR, `metadata-${version}.json`),
  };
  
  const downloads = [
    {
      url: `${S3_BASE_URL}/${version}/model.joblib`,
      local: files.model,
      name: 'model.joblib',
    },
    {
      url: `${S3_BASE_URL}/${version}/encoders.joblib`,
      local: files.encoders,
      name: 'encoders.joblib',
    },
    {
      url: `${S3_BASE_URL}/${version}/metadata.json`,
      local: files.metadata,
      name: 'metadata.json',
    },
  ];
  
  for (const download of downloads) {
    if (!fs.existsSync(download.local)) {
      console.log(`[ML] Downloading ${download.name} from S3...`);
      try {
        await downloadFile(download.url, download.local);
        const sizeMB = (fs.statSync(download.local).size / (1024 * 1024)).toFixed(2);
        console.log(`[ML] ✅ Downloaded ${download.name} (${sizeMB} MB)`);
      } catch (error) {
        console.error(`[ML] ❌ Failed to download ${download.name}:`, error);
        throw error;
      }
    } else {
      console.log(`[ML] ✅ ${download.name} already cached`);
    }
  }
  
  return files;
}

/**
 * Get model file paths (download if needed)
 */
export async function getModelPaths(version: string = MODEL_VERSION): Promise<ModelFiles> {
  return await downloadModels(version);
}

/**
 * Clear model cache
 */
export function clearModelCache(): void {
  if (fs.existsSync(CACHE_DIR)) {
    fs.rmSync(CACHE_DIR, { recursive: true, force: true });
    console.log('[ML] Model cache cleared');
  }
}
