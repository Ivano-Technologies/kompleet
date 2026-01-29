// Cryptographic helpers
import * as crypto from 'crypto';

export const hashString = (input: string): string => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};
