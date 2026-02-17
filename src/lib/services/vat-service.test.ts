import { describe, it, expect } from 'vitest';
import { VATService, VATTransaction } from './vat-service';

describe('VAT Service', () => {
  describe('VAT Treatment Determination', () => {
    it('should classify standard-rated supplies', () => {
      const treatment = VATService.determineVATTreatment('office_supplies', 'income', true);
      expect(treatment).toBe('standard');
    });

    it('should classify exempt supplies', () => {
      const treatment = VATService.determineVATTreatment('medical_services', 'income', true);
      expect(treatment).toBe('exempt');
    });

    it('should classify zero-rated supplies', () => {
      const treatment = VATService.determineVATTreatment('exported_goods', 'income', true);
      expect(treatment).toBe('zero-rated');
    });

    it('should classify unregistered business income as out-of-scope', () => {
      const treatment = VATService.determineVATTreatment('office_supplies', 'income', false);
      expect(treatment).toBe('out-of-scope');
    });

    it('should allow VAT on expenses regardless of registration', () => {
      const treatment = VATService.determineVATTreatment('office_supplies', 'expense', false);
      expect(treatment).toBe('standard');
    });
  });

  describe('Transaction VAT Calculation', () => {
    it('should calculate VAT on standard-rated income', () => {
      const transaction: VATTransaction = {
        id: '1',
        type: 'income',
        amount: 100_000,
        description: 'Sales',
        date: '2026-02-01',
        category: 'sales',
        vatTreatment: 'standard',
      };

      const calculation = VATService.calculateTransactionVAT(transaction, true);

      expect(calculation.vatRate).toBe(0.075);
      expect(calculation.vatAmount).toBe(7_500);
      expect(calculation.netAmount).toBe(107_500);
      expect(calculation.isRecoverable).toBe(false);
    });

    it('should calculate recoverable VAT on expenses', () => {
      const transaction: VATTransaction = {
        id: '2',
        type: 'expense',
        amount: 50_000,
        description: 'Office supplies',
        date: '2026-02-01',
        category: 'office_supplies',
        vatTreatment: 'standard',
        vatRecoverable: true,
      };

      const calculation = VATService.calculateTransactionVAT(transaction, true);

      expect(calculation.vatAmount).toBe(3_750);
      expect(calculation.isRecoverable).toBe(true);
    });

    it('should not charge VAT on exempt supplies', () => {
      const transaction: VATTransaction = {
        id: '3',
        type: 'income',
        amount: 100_000,
        description: 'Medical services',
        date: '2026-02-01',
        category: 'medical_services',
        vatTreatment: 'exempt',
      };

      const calculation = VATService.calculateTransactionVAT(transaction, true);

      expect(calculation.vatAmount).toBe(0);
      expect(calculation.vatTreatment).toBe('exempt');
      expect(calculation.isRecoverable).toBe(false);
    });

    it('should charge zero VAT on zero-rated supplies but allow recovery', () => {
      const transaction: VATTransaction = {
        id: '4',
        type: 'expense',
        amount: 50_000,
        description: 'Exported goods',
        date: '2026-02-01',
        category: 'exported_goods',
        vatTreatment: 'zero-rated',
      };

      const calculation = VATService.calculateTransactionVAT(transaction, true);

      expect(calculation.vatAmount).toBe(0);
      expect(calculation.vatTreatment).toBe('zero-rated');
      expect(calculation.isRecoverable).toBe(true);
    });

    it('should not charge VAT for unregistered business', () => {
      const transaction: VATTransaction = {
        id: '5',
        type: 'income',
        amount: 100_000,
        description: 'Sales',
        date: '2026-02-01',
        category: 'sales',
        vatTreatment: 'standard',
      };

      const calculation = VATService.calculateTransactionVAT(transaction, false);

      expect(calculation.vatAmount).toBe(0);
      expect(calculation.vatTreatment).toBe('out-of-scope');
    });
  });

  describe('VAT Summary Calculation', () => {
    it('should calculate VAT summary for a period', () => {
      const transactions: VATTransaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 1_000_000,
          description: 'Sales',
          date: '2026-02-01',
          category: 'sales',
          vatTreatment: 'standard',
        },
        {
          id: '2',
          type: 'expense',
          amount: 500_000,
          description: 'Purchases',
          date: '2026-02-05',
          category: 'purchases',
          vatTreatment: 'standard',
          vatRecoverable: true,
        },
      ];

      const summary = VATService.calculateVATSummary(transactions, '2026-02', true);

      expect(summary.totalSalesGross).toBe(1_000_000);
      expect(summary.totalSalesVAT).toBe(75_000);
      expect(summary.totalPurchasesGross).toBe(500_000);
      expect(summary.totalPurchasesVAT).toBe(37_500);
      expect(summary.recoverableVAT).toBe(37_500);
      expect(summary.netVATPayable).toBe(37_500); // 75,000 - 37,500
    });

    it('should calculate correct filing deadline', () => {
      const transactions: VATTransaction[] = [];
      const summary = VATService.calculateVATSummary(transactions, '2026-01', true);

      // Q1 (Jan-Mar) deadline is last day of April
      expect(summary.filingDeadline).toBe('2026-04-28');
    });

    it('should handle zero-rated supplies correctly', () => {
      const transactions: VATTransaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 500_000,
          description: 'Exported goods',
          date: '2026-02-01',
          category: 'exported_goods',
          vatTreatment: 'zero-rated',
        },
        {
          id: '2',
          type: 'expense',
          amount: 100_000,
          description: 'Input VAT',
          date: '2026-02-05',
          category: 'purchases',
          vatTreatment: 'standard',
          vatRecoverable: true,
        },
      ];

      const summary = VATService.calculateVATSummary(transactions, '2026-02', true);

      expect(summary.totalSalesVAT).toBe(0); // Zero-rated
      expect(summary.recoverableVAT).toBe(7_500); // Input VAT recoverable
      expect(summary.netVATPayable).toBe(-7_500); // Refund due
    });
  });

  describe('VAT Registration', () => {
    it('should determine registration threshold', () => {
      expect(VATService.qualifiesForRegistration(25_000_000)).toBe(true);
      expect(VATService.qualifiesForRegistration(24_999_999)).toBe(false);
      expect(VATService.qualifiesForRegistration(30_000_000)).toBe(true);
    });
  });

  describe('VAT Forms Generation', () => {
    it('should generate Form A for registered traders', () => {
      const transactions: VATTransaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 1_000_000,
          description: 'Sales',
          date: '2026-02-01',
          category: 'sales',
          vatTreatment: 'standard',
        },
      ];

      const summary = VATService.calculateVATSummary(transactions, '2026-02', true);
      const form = VATService.generateFormA(summary, 'Test Business', 'TIN123456');

      expect(form.formType).toBe('A');
      expect(form.businessName).toBe('Test Business');
      expect(form.tinNumber).toBe('TIN123456');
      expect(form.outputVAT).toBe(75_000);
    });

    it('should throw error generating Form A for unregistered trader', () => {
      const summary = VATService.calculateVATSummary([], '2026-02', false);

      expect(() => {
        VATService.generateFormA(summary, 'Test Business', 'TIN123456');
      }).toThrow();
    });

    it('should generate Form B for non-registered traders', () => {
      const form = VATService.generateFormB(10_000_000, 'Small Business');

      expect(form.formType).toBe('B');
      expect(form.businessName).toBe('Small Business');
      expect(form.totalTurnover).toBe(10_000_000);
    });
  });

  describe('VAT Price Calculations', () => {
    it('should extract VAT from inclusive price', () => {
      const result = VATService.extractVATFromInclusive(107_500);

      expect(result.netAmount).toBe(100_000);
      expect(result.vatAmount).toBe(7_500);
    });

    it('should add VAT to exclusive price', () => {
      const result = VATService.addVATToExclusive(100_000);

      expect(result.netAmount).toBe(100_000);
      expect(result.vatAmount).toBe(7_500);
      expect(result.inclusivePrice).toBe(107_500);
    });

    it('should handle custom VAT rates', () => {
      const result = VATService.addVATToExclusive(100_000, 0.05);

      expect(result.vatAmount).toBe(5_000);
      expect(result.inclusivePrice).toBe(105_000);
    });
  });

  describe('VAT Compliance Validation', () => {
    it('should validate compliant VAT summary', () => {
      const transactions: VATTransaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 1_000_000,
          description: 'Sales',
          date: '2026-02-01',
          category: 'sales',
          vatTreatment: 'standard',
        },
      ];

      const summary = VATService.calculateVATSummary(transactions, '2026-02', true);
      const validation = VATService.validateCompliance(summary);

      expect(validation.isCompliant).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should flag unregistered business with high turnover', () => {
      const transactions: VATTransaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 30_000_000,
          description: 'Sales',
          date: '2026-02-01',
          category: 'sales',
          vatTreatment: 'standard',
        },
      ];

      const summary = VATService.calculateVATSummary(transactions, '2026-02', false);
      const validation = VATService.validateCompliance(summary);

      expect(validation.isCompliant).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    it('should warn about VAT refund due', () => {
      const transactions: VATTransaction[] = [
        {
          id: '1',
          type: 'expense',
          amount: 1_000_000,
          description: 'Purchases',
          date: '2026-02-01',
          category: 'purchases',
          vatTreatment: 'standard',
          vatRecoverable: true,
        },
      ];

      const summary = VATService.calculateVATSummary(transactions, '2026-02', true);
      const validation = VATService.validateCompliance(summary);

      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amounts', () => {
      const transaction: VATTransaction = {
        id: '1',
        type: 'income',
        amount: 0,
        description: 'Zero transaction',
        date: '2026-02-01',
        category: 'sales',
        vatTreatment: 'standard',
      };

      const calculation = VATService.calculateTransactionVAT(transaction, true);

      expect(calculation.vatAmount).toBe(0);
      expect(calculation.netAmount).toBe(0);
    });

    it('should handle very large amounts', () => {
      const transaction: VATTransaction = {
        id: '1',
        type: 'income',
        amount: 1_000_000_000,
        description: 'Large transaction',
        date: '2026-02-01',
        category: 'sales',
        vatTreatment: 'standard',
      };

      const calculation = VATService.calculateTransactionVAT(transaction, true);

      expect(calculation.vatAmount).toBe(75_000_000);
    });

    it('should handle empty transaction list', () => {
      const summary = VATService.calculateVATSummary([], '2026-02', true);

      expect(summary.totalSalesGross).toBe(0);
      expect(summary.totalSalesVAT).toBe(0);
      expect(summary.netVATPayable).toBe(0);
    });
  });
});
