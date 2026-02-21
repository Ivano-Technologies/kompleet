/**
 * API response contract tests (TDD)
 * apiSuccess / apiError produce consistent JSON shape with data or error + meta.timestamp.
 */

import { describe, it, expect } from 'vitest';
import { apiSuccess, apiError } from '@/lib/api';

describe('API contracts', () => {
  describe('apiSuccess', () => {
    it('returns JSON with data and meta.timestamp', async () => {
      const res = apiSuccess({ id: '1', name: 'test' }, 200);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('data');
      expect(body.data).toEqual({ id: '1', name: 'test' });
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('timestamp');
      expect(typeof body.meta.timestamp).toBe('string');
    });
  });

  describe('apiError', () => {
    it('returns JSON with error.code, error.message and meta.timestamp', async () => {
      const res = apiError('NOT_FOUND', 'Resource not found', 404);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(body.error).toHaveProperty('message', 'Resource not found');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('timestamp');
    });
  });
});
