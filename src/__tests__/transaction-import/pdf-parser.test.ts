/**
 * PDF Parser Tests (TDD Priority 0)
 * Expected: parsePDF returns ParseResult shape; no module resolution errors.
 * Input/output contracts:
 * - parsePDF(buffer, bankName?) -> { transactions, errors, totalRows, successfulRows }
 * - When text extraction fails or yields <50 chars -> errors include EMPTY_PDF or similar
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ParseResult } from '../../lib/transaction-import/csv-parser';

// Mock pdf-parse so we don't depend on native/binary in CI
vi.mock('pdf-parse', () => {
  const mockGetText = vi.fn();
  const mockDestroy = vi.fn().mockResolvedValue(undefined);
  return {
    PDFParse: class MockPDFParse {
      constructor(_opts: { data: Buffer }) {}
      getText() {
        return mockGetText();
      }
      destroy() {
        return mockDestroy();
      }
    },
    __setGetTextResult: (text: string, total: number) => {
      mockGetText.mockResolvedValue({ text, total: total ?? 1 });
    },
    __setGetTextError: (err: Error) => {
      mockGetText.mockRejectedValue(err);
    },
  };
});

// Avoid real OpenAI and tesseract in tests
vi.mock('openai', () => ({ default: vi.fn(() => ({ chat: { completions: { create: vi.fn() } } })) }));
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn().mockResolvedValue({
    recognize: vi.fn().mockResolvedValue({ data: { text: '' } }),
    terminate: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('PDF Parser', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns ParseResult shape with transactions and errors arrays', async () => {
    const { parsePDF } = await import('../../lib/transaction-import/pdf-parser');
    // With no __setGetTextResult, getText returns undefined -> rawText stays empty -> we get error response
    const buffer = Buffer.alloc(200);
    const result: ParseResult = await parsePDF(buffer, 'GTBank');

    expect(result).toBeDefined();
    expect(Array.isArray(result.transactions)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(typeof result.totalRows).toBe('number');
    expect(typeof result.successfulRows).toBe('number');
  });

  it('returns errors when PDF text extraction yields too little text', async () => {
    const { parsePDF } = await import('../../lib/transaction-import/pdf-parser');
    const { __setGetTextResult } = await import('pdf-parse');
    (__setGetTextResult as (text: string, total?: number) => void)('short', 1);

    const buffer = Buffer.alloc(200);
    const result = await parsePDF(buffer);

    expect(result.transactions).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.errorType === 'EMPTY_PDF' || e.errorType === 'NO_API_KEY' || e.errorType === 'PDF_PARSE_ERROR')).toBe(true);
    expect(result.totalRows).toBe(0);
    expect(result.successfulRows).toBe(0);
  });

  it('does not throw when module is loaded', async () => {
    await expect(import('../../lib/transaction-import/pdf-parser')).resolves.toBeDefined();
    const mod = await import('../../lib/transaction-import/pdf-parser');
    expect(typeof mod.parsePDF).toBe('function');
  });
});
