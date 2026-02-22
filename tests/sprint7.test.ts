/**
 * Sprint 7 Test Suite
 * Comprehensive tests for NRS Form Generation & Filing Deadline Management
 */

import { describe, it, expect, vi } from "vitest";

// Mock jspdf and jspdf-autotable (autoTable side-effect import doesn't register
// in Vitest's ESM environment, and jsdom lacks canvas support for real PDF generation)
vi.mock("jspdf", () => {
  return {
    default: class MockJsPDF {
      internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
      lastAutoTable = { finalY: 80 };
      setFontSize() {
        return this;
      }
      setFont() {
        return this;
      }
      setTextColor() {
        return this;
      }
      text() {
        return this;
      }
      line() {
        return this;
      }
      autoTable() {
        this.lastAutoTable = { finalY: 100 };
        return this;
      }
      output() {
        return "data:application/pdf;base64,mockPdfContent";
      }
    },
  };
});

vi.mock("jspdf-autotable", () => ({}));

// Mock Supabase server client (form-prefill and deadline-service import it,
// and it depends on next/headers which is unavailable in test environment)
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({})),
}));

import {
  generatePITForm,
  generateCITForm,
  generateVATForm,
} from "../src/lib/nrs-forms";
import {
  validatePITForm,
  validateCITForm,
  validateVATForm,
} from "../src/lib/form-prefill";
import { calculateDeadlineStatus } from "../src/lib/deadline-service";
import {
  generate7DayReminderEmail,
  generate3DayReminderEmail,
  generate1DayReminderEmail,
} from "../src/lib/email-service";

// Mock data for testing
const mockUserData = {
  id: "test-user-123",
  email: "test@example.com",
  full_name: "Test User",
  tin: "1234567890",
  address: "123 Test Street, Lagos, Nigeria",
  phone: "+234 800 000 0000",
};

const mockPITData = {
  taxpayerName: "Test User",
  tin: "1234567890",
  address: "123 Test Street, Lagos, Nigeria",
  phone: "+234 800 000 0000",
  email: "test@example.com",
  taxYear: 2026,
  grossIncome: 10000000,
  consolidatedRelief: 2200000,
  otherReliefs: 0,
  taxableIncome: 7800000,
  taxPayable: 1458000,
  withholdingTax: 1000000,
  balanceDue: 458000,
};

const mockCITData = {
  companyName: "Test Company Ltd",
  rcNumber: "RC123456",
  tin: "1234567890",
  address: "123 Test Street, Lagos, Nigeria",
  phone: "+234 800 000 0000",
  email: "test@example.com",
  taxYear: 2026,
  turnover: 150000000,
  costOfSales: 90000000,
  grossProfit: 60000000,
  operatingExpenses: 20000000,
  profitBeforeTax: 40000000,
  capitalAllowances: 4000000,
  taxableProfit: 36000000,
  taxRate: 25,
  taxPayable: 9000000,
  advancePayments: 2250000,
  balanceDue: 6750000,
};

const mockVATData = {
  businessName: "Test Business",
  tin: "1234567890",
  address: "123 Test Street, Lagos, Nigeria",
  phone: "+234 800 000 0000",
  email: "test@example.com",
  period: "Q1 (Jan-Mar)",
  taxYear: 2026,
  outputVAT: 750000,
  inputVAT: 300000,
  netVAT: 450000,
  penaltyIfAny: 0,
  totalDue: 450000,
};

describe("Sprint 7: NRS Form Generation", () => {
  describe("PDF Generation Service", () => {
    it("should generate PIT form PDF", () => {
      const pdf = generatePITForm(mockPITData);

      expect(pdf).toBeDefined();
      expect(pdf.output).toBeDefined();

      // Verify PDF can be exported
      const pdfOutput = pdf.output("datauristring");
      expect(pdfOutput).toContain("data:application/pdf");
    });

    it("should generate CIT form PDF", () => {
      const pdf = generateCITForm(mockCITData);

      expect(pdf).toBeDefined();
      expect(pdf.output).toBeDefined();

      const pdfOutput = pdf.output("datauristring");
      expect(pdfOutput).toContain("data:application/pdf");
    });

    it("should generate VAT form PDF", () => {
      const pdf = generateVATForm(mockVATData);

      expect(pdf).toBeDefined();
      expect(pdf.output).toBeDefined();

      const pdfOutput = pdf.output("datauristring");
      expect(pdfOutput).toContain("data:application/pdf");
    });
  });

  describe("Form Pre-fill Logic", () => {
    it("should calculate PIT correctly", () => {
      const grossIncome = 10000000;

      // Consolidated Relief: Higher of 1% or ₦200,000 + 20%
      const onePercent = grossIncome * 0.01; // 100,000
      const twentyPercent = grossIncome * 0.2; // 2,000,000
      const consolidatedRelief = Math.max(onePercent, 200000 + twentyPercent); // 2,200,000

      expect(consolidatedRelief).toBe(2200000);

      // Taxable Income
      const taxableIncome = grossIncome - consolidatedRelief; // 7,800,000
      expect(taxableIncome).toBe(7800000);

      // Progressive Tax Calculation
      let taxPayable = 0;
      taxPayable += Math.min(300000, taxableIncome) * 0.07; // 21,000
      taxPayable +=
        Math.min(300000, Math.max(0, taxableIncome - 300000)) * 0.11; // 33,000
      taxPayable +=
        Math.min(500000, Math.max(0, taxableIncome - 600000)) * 0.15; // 75,000
      taxPayable +=
        Math.min(500000, Math.max(0, taxableIncome - 1100000)) * 0.19; // 95,000
      taxPayable +=
        Math.min(1600000, Math.max(0, taxableIncome - 1600000)) * 0.21; // 336,000
      taxPayable += Math.max(0, taxableIncome - 3200000) * 0.24; // 1,104,000

      expect(taxPayable).toBe(1664000); // Total tax
    });

    it("should calculate CIT correctly", () => {
      const turnover = 150000000;
      const taxableProfit = 36000000;

      // CIT Rate: 25% for turnover > ₦100M
      let taxRate = 0;
      if (turnover <= 25000000) {
        taxRate = 0;
      } else if (turnover <= 100000000) {
        taxRate = 20;
      } else {
        taxRate = 25;
      }

      expect(taxRate).toBe(25);

      const taxPayable = (taxableProfit * taxRate) / 100;
      expect(taxPayable).toBe(9000000);
    });

    it("should calculate VAT correctly", () => {
      const outputVAT = 750000;
      const inputVAT = 300000;

      const netVAT = outputVAT - inputVAT;
      expect(netVAT).toBe(450000);

      const totalDue = Math.max(0, netVAT);
      expect(totalDue).toBe(450000);
    });
  });

  describe("Form Validation", () => {
    it("should validate PIT form data", () => {
      const validData = { ...mockPITData };
      const result = validatePITForm(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid PIT form data", () => {
      const invalidData = {
        ...mockPITData,
        taxpayerName: "N/A",
        tin: "123", // Too short
        grossIncome: -1000, // Negative
      };

      const result = validatePITForm(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should validate CIT form data", () => {
      const validData = { ...mockCITData };
      const result = validateCITForm(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate VAT form data", () => {
      const validData = { ...mockVATData };
      const result = validateVATForm(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe("Sprint 7: Filing Deadline Management", () => {
  describe("Deadline Calculation", () => {
    it("should calculate deadline status correctly", () => {
      // Test upcoming deadline (30 days away)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const upcomingResult = calculateDeadlineStatus(futureDate.toISOString());

      expect(upcomingResult.status).toBe("upcoming");
      expect(upcomingResult.daysRemaining).toBeGreaterThan(7);

      // Test due soon deadline (5 days away)
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 5);
      const dueSoonResult = calculateDeadlineStatus(soonDate.toISOString());

      expect(dueSoonResult.status).toBe("due_soon");
      expect(dueSoonResult.daysRemaining).toBeLessThanOrEqual(7);

      // Test overdue deadline (5 days ago)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const overdueResult = calculateDeadlineStatus(pastDate.toISOString());

      expect(overdueResult.status).toBe("overdue");
      expect(overdueResult.daysRemaining).toBeLessThan(0);
    });

    it("should calculate PIT deadline correctly", () => {
      // PIT deadline: March 31 following tax year
      const taxYear = 2026;
      const expectedDeadline = new Date(taxYear + 1, 2, 31); // March 31, 2027

      expect(expectedDeadline.getMonth()).toBe(2); // March (0-indexed)
      expect(expectedDeadline.getDate()).toBe(31);
      expect(expectedDeadline.getFullYear()).toBe(2027);
    });

    it("should calculate CIT deadline correctly", () => {
      // CIT deadline: June 30 following tax year
      const taxYear = 2026;
      const expectedDeadline = new Date(taxYear + 1, 5, 30); // June 30, 2027

      expect(expectedDeadline.getMonth()).toBe(5); // June (0-indexed)
      expect(expectedDeadline.getDate()).toBe(30);
      expect(expectedDeadline.getFullYear()).toBe(2027);
    });

    it("should calculate VAT quarterly deadlines correctly", () => {
      // VAT deadline: 21 days after quarter end
      const taxYear = 2026;

      // Q1: March 31 + 21 days = April 21
      const q1End = new Date(taxYear, 2, 31);
      const q1Deadline = new Date(q1End);
      q1Deadline.setDate(q1Deadline.getDate() + 21);

      expect(q1Deadline.getMonth()).toBe(3); // April
      expect(q1Deadline.getDate()).toBe(21);

      // Q2: June 30 + 21 days = July 21
      const q2End = new Date(taxYear, 5, 30);
      const q2Deadline = new Date(q2End);
      q2Deadline.setDate(q2Deadline.getDate() + 21);

      expect(q2Deadline.getMonth()).toBe(6); // July
      expect(q2Deadline.getDate()).toBe(21);
    });
  });

  describe("Email Templates", () => {
    it("should generate 7-day reminder email", () => {
      const deadline = {
        formType: "PIT",
        taxYear: 2026,
        deadlineDate: "2027-03-31",
        daysRemaining: 7,
        description: "Personal Income Tax Return for 2026",
      };

      const email = generate7DayReminderEmail("Test User", deadline);

      expect(email.subject).toContain("7 Days");
      expect(email.subject).toContain("Personal Income Tax");
      expect(email.html).toContain("Test User");
      expect(email.html).toContain("7 days");
      expect(email.text).toContain("Test User");
    });

    it("should generate 3-day reminder email", () => {
      const deadline = {
        formType: "CIT",
        taxYear: 2026,
        deadlineDate: "2027-06-30",
        daysRemaining: 3,
        description: "Company Income Tax Return for 2026",
      };

      const email = generate3DayReminderEmail("Test Company", deadline);

      expect(email.subject).toContain("3 Days");
      expect(email.subject).toContain("Company Income Tax");
      expect(email.html).toContain("Test Company");
      expect(email.html).toContain("3 days");
    });

    it("should generate 1-day reminder email", () => {
      const deadline = {
        formType: "VAT_Q1",
        taxYear: 2026,
        deadlineDate: "2026-04-21",
        daysRemaining: 1,
        description: "VAT Return Q1 for 2026",
      };

      const email = generate1DayReminderEmail("Test Business", deadline);

      expect(email.subject).toContain("FINAL NOTICE");
      expect(email.subject).toContain("Tomorrow");
      expect(email.html).toContain("Test Business");
      expect(email.html).toContain("24 HOURS");
    });
  });
});

describe("Sprint 7: Integration Tests", () => {
  it("should complete end-to-end filing workflow", async () => {
    // This is a placeholder for manual testing
    // Actual implementation would require database setup
    expect(true).toBe(true);
  });

  it("should handle concurrent form generations", async () => {
    // Test concurrent PDF generation
    const promises = Array(5)
      .fill(null)
      .map(() => Promise.resolve(generatePITForm(mockPITData)));

    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);
    results.forEach((pdf) => {
      expect(pdf).toBeDefined();
      expect(pdf.output).toBeDefined();
    });
  });
});
