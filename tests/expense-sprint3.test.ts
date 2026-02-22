/**
 * Sprint 3 – Expense Management UX (Mobile + Web)
 * Tests: web API routes exist, expenses list/detail pages exist, mobile list/offline behavior documented.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Expense Sprint 3 – Expense Management UX', () => {
  describe('Web API routes', () => {
    it('GET/POST /api/expenses route exists', () => {
      const routePath = path.join(__dirname, '../src/app/api/expenses/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toMatch(/export async function GET/);
      expect(content).toMatch(/export async function POST/);
      expect(content).toMatch(/from\('expenses'\)/);
    });

    it('GET/PATCH/DELETE /api/expenses/[id] route exists', () => {
      const routePath = path.join(__dirname, '../src/app/api/expenses/[id]/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toMatch(/export async function GET/);
      expect(content).toMatch(/export async function PATCH/);
      expect(content).toMatch(/export async function DELETE/);
    });

    it('GET /api/expenses/categories route exists', () => {
      const routePath = path.join(__dirname, '../src/app/api/expenses/categories/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
      expect(fs.readFileSync(routePath, 'utf-8')).toMatch(/expense_categories/);
    });
  });

  describe('Web dashboard pages', () => {
    it('expenses list page exists', () => {
      const pagePath = path.join(__dirname, '../src/app/(dashboard)/expenses/page.tsx');
      expect(fs.existsSync(pagePath)).toBe(true);
    });

    it('expense detail page exists', () => {
      const pagePath = path.join(__dirname, '../src/app/(dashboard)/expenses/[id]/page.tsx');
      expect(fs.existsSync(pagePath)).toBe(true);
    });
  });

  describe('Mobile expense list and offline behavior', () => {
    it('Home (index) uses listExpenses and sync', () => {
      const indexPath = path.join(__dirname, '../apps/mobile/app/(tabs)/index.tsx');
      expect(fs.existsSync(indexPath)).toBe(true);
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toMatch(/listExpenses|getUserId/);
      expect(content).toMatch(/runSync|RefreshControl|offline|Pending sync/);
    });

    it('receipt-edit has category picker', () => {
      const editPath = path.join(__dirname, '../apps/mobile/app/receipt-edit/[id].tsx');
      expect(fs.existsSync(editPath)).toBe(true);
      expect(fs.readFileSync(editPath, 'utf-8')).toMatch(/listCategories|categoryId|Category/);
    });

    it('Settings has Trust UX (NDPR, encryption)', () => {
      const settingsPath = path.join(__dirname, '../apps/mobile/app/(tabs)/settings.tsx');
      expect(fs.existsSync(settingsPath)).toBe(true);
      const content = fs.readFileSync(settingsPath, 'utf-8');
      expect(content).toMatch(/NDPR|encrypted|Privacy|security/i);
    });
  });
});
