// Cryptographic helpers
import * as crypto from 'crypto';

export const hashString = (input: string): string => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Encryption for OAuth tokens
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32b';
const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
