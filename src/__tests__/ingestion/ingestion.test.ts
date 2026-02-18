/**
 * Comprehensive test suite for ingestion pipeline
 */

import { describe, it, expect } from 'vitest';
import { detectFileType, isSupportedFileType } from '@/lib/ingestion/detectFileType';
import { detectEncryption } from '@/lib/ingestion/detectEncryption';
import { normalizeTransactions } from '@/lib/ingestion/normalizeTransactions';
import { deduplicateTransactions } from '@/lib/ingestion/deduplicate';
import { validateTransactions } from '@/lib/ingestion/validate';
import { sanitizeTransactions } from '@/lib/ingestion/sanitizeForAI';

describe('Ingestion Pipeline', () => {
  describe('File Type Detection', () => {
    it('should detect PDF files', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4');
      expect(detectFileType(pdfBuffer, 'test.pdf')).toBe('pdf');
    });

    it('should detect Excel files by extension', () => {
      const xlsxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // ZIP header
      expect(detectFileType(xlsxBuffer, 'test.xlsx')).toBe('xlsx');
    });

    it('should detect CSV files', () => {
      const csvBuffer = Buffer.from('name,email,amount\n');
      expect(detectFileType(csvBuffer, 'test.csv')).toBe('csv');
    });

    it('should detect ZIP files', () => {
      const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // ZIP header
      expect(detectFileType(zipBuffer, 'test.zip')).toBe('zip');
    });

    it('should support file extension fallback', () => {
      const unknownBuffer = Buffer.from('unknown content');
      expect(detectFileType(unknownBuffer, 'test.pdf')).toBe('pdf');
    });

    it('should validate supported file types', () => {
      expect(isSupportedFileType('pdf')).toBe(true);
      expect(isSupportedFileType('xlsx')).toBe(true);
      expect(isSupportedFileType('csv')).toBe(true);
      expect(isSupportedFileType('zip')).toBe(true);
      expect(isSupportedFileType('doc')).toBe(false);
    });
  });

  describe('Encryption Detection', () => {
    it('should detect encrypted PDFs', () => {
      const encryptedPdf = Buffer.from('%PDF-1.4\n/Encrypt');
      const result = detectEncryption(encryptedPdf, 'pdf');
      expect(result.isEncrypted).toBe(true);
    });

    it('should detect unencrypted PDFs', () => {
      const unencryptedPdf = Buffer.from('%PDF-1.4\n/Pages');
      const result = detectEncryption(unencryptedPdf, 'pdf');
      expect(result.isEncrypted).toBe(false);
    });

    it('should flag password requirement for encrypted files', () => {
      const encryptedPdf = Buffer.from('%PDF-1.4\n/Encrypt');
      const result = detectEncryption(encryptedPdf, 'pdf');
      expect(result.requiresPassword).toBe(true);
    });
  });

  describe('Transaction Normalization', () => {
    it('should normalize dates', () => {
      const transactions = [
        {
          date: '15/02/2026',
          amount: '1000',
          type: 'debit',
          description: 'Payment',
        },
      ];

      const { transactions: normalized } = normalizeTransactions(transactions as any, 'csv', 'user1', 'file1');
      expect(normalized[0].date).toMatch(/2026-02-15/);
    });

    it('should normalize amounts', () => {
      const transactions = [
        {
          date: '2026-02-15',
          amount: '₦1,000.50',
          type: 'debit',
          description: 'Payment',
        },
      ];

      const { transactions: normalized } = normalizeTransactions(transactions as any, 'csv', 'user1', 'file1');
      expect(normalized[0].amount).toBe(1000.5);
    });

    it('should detect transaction types', () => {
      const transactions = [
        {
          date: '2026-02-15',
          amount: '-1000',
          type: 'unknown',
          description: 'Payment',
        },
        {
          date: '2026-02-15',
          amount: '1000',
          type: 'unknown',
          description: 'Deposit',
        },
      ];

      const { transactions: normalized } = normalizeTransactions(transactions as any, 'csv', 'user1', 'file1');
      expect(normalized[0].type).toBe('debit');
      expect(normalized[1].type).toBe('credit');
    });

    it('should sanitize descriptions', () => {
      const transactions = [
        {
          date: '2026-02-15',
          amount: '1000',
          type: 'debit',
          description: 'Payment to 1234567890123456',
        },
      ];

      const { transactions: normalized } = normalizeTransactions(transactions as any, 'csv', 'user1', 'file1');
      expect(normalized[0].description).not.toContain('1234567890123456');
    });
  });

  describe('Deduplication', () => {
    it('should remove duplicate transactions', () => {
      const transactions = [
        {
          id: '1',
          date: '2026-02-15',
          amount: 1000,
          type: 'debit',
          description: 'Payment',
          user_id: 'user1',
          source_file_id: 'file1',
        },
        {
          id: '2',
          date: '2026-02-15',
          amount: 1000,
          type: 'debit',
          description: 'Payment',
          user_id: 'user1',
          source_file_id: 'file1',
        },
      ];

      const deduplicated = deduplicateTransactions(transactions);
      expect(deduplicated).toHaveLength(1);
    });

    it('should keep unique transactions', () => {
      const transactions = [
        {
          id: '1',
          date: '2026-02-15',
          amount: 1000,
          type: 'debit',
          description: 'Payment 1',
          user_id: 'user1',
          source_file_id: 'file1',
        },
        {
          id: '2',
          date: '2026-02-15',
          amount: 2000,
          type: 'debit',
          description: 'Payment 2',
          user_id: 'user1',
          source_file_id: 'file1',
        },
      ];

      const deduplicated = deduplicateTransactions(transactions);
      expect(deduplicated).toHaveLength(2);
    });
  });

  describe('Validation', () => {
    it('should validate required fields', () => {
      const transactions = [
        {
          id: '1',
          date: '2026-02-15',
          amount: 1000,
          type: 'debit',
          description: 'Payment',
          user_id: 'user1',
          source_file_id: 'file1',
        },
      ];

      const { valid, errors } = validateTransactions(transactions);
      expect(valid).toHaveLength(1);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid dates', () => {
      const transactions = [
        {
          id: '1',
          date: 'invalid-date',
          amount: 1000,
          type: 'debit',
          description: 'Payment',
          user_id: 'user1',
          source_file_id: 'file1',
        },
      ];

      const { valid, errors } = validateTransactions(transactions);
      expect(valid).toHaveLength(0);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should enforce amount range', () => {
      const transactions = [
        {
          id: '1',
          date: '2026-02-15',
          amount: 2_000_000_000,
          type: 'debit',
          description: 'Payment',
          user_id: 'user1',
          source_file_id: 'file1',
        },
      ];

      const { valid, errors } = validateTransactions(transactions);
      expect(valid).toHaveLength(0);
      expect(errors.some(e => e.errorType === 'AMOUNT_OUT_OF_RANGE')).toBe(true);
    });

    it('should validate transaction types', () => {
      const transactions = [
        {
          id: '1',
          date: '2026-02-15',
          amount: 1000,
          type: 'invalid',
          description: 'Payment',
          user_id: 'user1',
          source_file_id: 'file1',
        },
      ];

      const { valid, errors } = validateTransactions(transactions);
      expect(valid).toHaveLength(0);
      expect(errors.some(e => e.errorType === 'INVALID_TYPE')).toBe(true);
    });
  });

  describe('AI Sanitization', () => {
    it('should remove account numbers', () => {
      const transactions = [
        {
          id: '1',
          date: '2026-02-15',
          amount: 1000,
          type: 'debit',
          description: 'Payment to 1234567890123456',
          user_id: 'user1',
          source_file_id: 'file1',
        },
      ];

      const sanitized = sanitizeTransactions(transactions);
      expect(sanitized[0].description).not.toContain('1234567890123456');
    });

    it('should remove email addresses', () => {
      const transactions = [
        {
          id: '1',
          date: '2026-02-15',
          amount: 1000,
          type: 'debit',
          description: 'Payment to user@example.com',
          user_id: 'user1',
          source_file_id: 'file1',
        },
      ];

      const sanitized = sanitizeTransactions(transactions);
      expect(sanitized[0].description).not.toContain('user@example.com');
    });

    it('should remove phone numbers', () => {
      const transactions = [
        {
          id: '1',
          date: '2026-02-15',
          amount: 1000,
          type: 'debit',
          description: 'Payment to 08012345678',
          user_id: 'user1',
          source_file_id: 'file1',
        },
      ];

      const sanitized = sanitizeTransactions(transactions);
      expect(sanitized[0].description).not.toContain('08012345678');
    });

    it('should remove IBAN/account identifiers', () => {
      const transactions = [
        {
          id: '1',
          date: '2026-02-15',
          amount: 1000,
          type: 'debit',
          description: 'Payment from GB82WEST12345698765432',
          user_id: 'user1',
          source_file_id: 'file1',
        },
      ];

      const sanitized = sanitizeTransactions(transactions);
      expect(sanitized[0].description).not.toContain('GB82WEST12345698765432');
    });
  });

  describe('End-to-End Pipeline', () => {
    it('should process a complete transaction batch', () => {
      const transactions = [
        {
          id: '1',
          date: '15/02/2026',
          amount: '₦1,000.50',
          type: 'unknown',
          description: 'Payment to 1234567890123456',
          user_id: 'user1',
          source_file_id: 'file1',
        },
        {
          id: '2',
          date: '15/02/2026',
          amount: '₦1,000.50',
          type: 'unknown',
          description: 'Payment to 1234567890123456',
          user_id: 'user1',
          source_file_id: 'file1',
        },
        {
          id: '3',
          date: '16/02/2026',
          amount: '₦2,000.00',
          type: 'unknown',
          description: 'Deposit',
          user_id: 'user1',
          source_file_id: 'file1',
        },
      ];

      // Normalize
      const { transactions: processed } = normalizeTransactions(transactions as any, 'csv', 'user1', 'file1');
      expect(processed).toHaveLength(3);

      // Deduplicate
      const deduplicated = deduplicateTransactions(processed);
      expect(deduplicated).toHaveLength(2); // One duplicate removed

      // Validate
      const { valid } = validateTransactions(deduplicated);
      expect(valid).toHaveLength(2);

      // Sanitize
      const sanitized = sanitizeTransactions(deduplicated);
      expect(sanitized).toHaveLength(2);
      expect(sanitized[0].description).not.toContain('1234567890123456');
    });
  });
});
