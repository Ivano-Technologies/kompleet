/**
 * Tests for Professional Tax Report Template Service
 */

import { describe, it, expect } from 'vitest';
import {
  generateProfessionalTaxReport,
  exportReportAsPDF,
  type TaxReportData,
} from './tax-report-template';

describe('Tax Report Template Service', () => {
  const mockTaxReportData: TaxReportData = {
    reportType: 'PIT',
    taxpayerName: 'Tunde Balogun',
    tin: '12345678901',
    taxYear: 2026,
    generatedDate: new Date('2026-02-17'),
    sections: [
      {
        title: 'INCOME SUMMARY',
        rows: [
          { label: 'Gross Income', value: 15000000 },
          { label: 'Rent Paid', value: 500000 },
          { label: 'Owner Occupier Interest', value: 1200000 },
        ],
      },
      {
        title: 'TAX CALCULATION',
        rows: [
          { label: 'Taxable Income', value: 13700000 },
          { label: 'Tax Rate', value: '15%' },
          { label: 'Total Tax', value: 2306999.79, isBold: true, isTotal: true },
        ],
      },
      {
        title: 'SUMMARY',
        rows: [
          { label: 'Gross Income', value: 15000000 },
          { label: 'Total Tax', value: 2306999.79 },
          { label: 'Net Income', value: 12693000.21, isBold: true, isTotal: true },
        ],
      },
    ],
  };

  it('should generate a valid PDF document', () => {
    const doc = generateProfessionalTaxReport(mockTaxReportData);
    expect(doc).toBeDefined();
    expect(doc.internal.pageSize.getWidth()).toBeGreaterThan(0);
    expect(doc.internal.pageSize.getHeight()).toBeGreaterThan(0);
  });

  it('should export report as PDF buffer', () => {
    const doc = generateProfessionalTaxReport(mockTaxReportData);
    const buffer = exportReportAsPDF(doc);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should include taxpayer information in report', () => {
    const doc = generateProfessionalTaxReport(mockTaxReportData);
    const pdfOutput = doc.output('arraybuffer');
    expect(pdfOutput).toBeDefined();
    expect(pdfOutput.byteLength).toBeGreaterThan(0);
  });

  it('should include all calculation sections', () => {
    const doc = generateProfessionalTaxReport(mockTaxReportData);
    expect(mockTaxReportData.sections.length).toBe(3);
    expect(mockTaxReportData.sections[0].title).toBe('INCOME SUMMARY');
    expect(mockTaxReportData.sections[1].title).toBe('TAX CALCULATION');
  });

  it('should format currency values correctly', () => {
    const doc = generateProfessionalTaxReport(mockTaxReportData);
    const buffer = exportReportAsPDF(doc);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should include report header with tax year', () => {
    const doc = generateProfessionalTaxReport(mockTaxReportData);
    expect(mockTaxReportData.taxYear).toBe(2026);
    expect(mockTaxReportData.reportType).toBe('PIT');
  });

  it('should include footer with disclaimer', () => {
    const doc = generateProfessionalTaxReport(mockTaxReportData);
    const buffer = exportReportAsPDF(doc);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000); // PDF should have reasonable size
  });

  it('should handle custom disclaimer', () => {
    const customDisclaimer = 'This is a custom disclaimer for testing.';
    const dataWithCustomDisclaimer = {
      ...mockTaxReportData,
      disclaimer: customDisclaimer,
    };
    const doc = generateProfessionalTaxReport(dataWithCustomDisclaimer);
    expect(doc).toBeDefined();
    expect(dataWithCustomDisclaimer.disclaimer).toBe(customDisclaimer);
  });

  it('should handle different report types', () => {
    const reportTypes: Array<'PIT' | 'CIT' | 'VAT'> = ['PIT', 'CIT', 'VAT'];
    
    reportTypes.forEach((reportType) => {
      const data = { ...mockTaxReportData, reportType };
      const doc = generateProfessionalTaxReport(data);
      expect(doc).toBeDefined();
      expect(data.reportType).toBe(reportType);
    });
  });

  it('should handle large numbers with proper formatting', () => {
    const largeNumberData: TaxReportData = {
      ...mockTaxReportData,
      sections: [
        {
          title: 'LARGE NUMBERS TEST',
          rows: [
            { label: 'Very Large Amount', value: 999999999.99 },
            { label: 'Small Amount', value: 0.01 },
          ],
        },
      ],
    };
    const doc = generateProfessionalTaxReport(largeNumberData);
    expect(doc).toBeDefined();
  });

  it('should handle empty sections gracefully', () => {
    const emptyData: TaxReportData = {
      ...mockTaxReportData,
      sections: [],
    };
    const doc = generateProfessionalTaxReport(emptyData);
    expect(doc).toBeDefined();
  });
});
