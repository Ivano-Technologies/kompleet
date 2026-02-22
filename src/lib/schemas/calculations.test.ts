import { describe, it, expect } from "vitest";
import {
  saveCalculationSchema,
  updateCalculationSchema,
  taxTypeEnum,
} from "./calculations";

describe("taxTypeEnum", () => {
  it("accepts valid tax types", () => {
    expect(taxTypeEnum.safeParse("pit").success).toBe(true);
    expect(taxTypeEnum.safeParse("cit").success).toBe(true);
    expect(taxTypeEnum.safeParse("vat").success).toBe(true);
    expect(taxTypeEnum.safeParse("wht").success).toBe(true);
  });

  it("rejects invalid tax types", () => {
    expect(taxTypeEnum.safeParse("income").success).toBe(false);
    expect(taxTypeEnum.safeParse("").success).toBe(false);
    expect(taxTypeEnum.safeParse("PIT").success).toBe(false);
  });
});

describe("saveCalculationSchema", () => {
  const validInput = {
    tax_type: "vat",
    tax_year: 2025,
    input_data: { revenue: 5000000 },
    gross_amount: 5000000,
    taxable_amount: 4500000,
    tax_due: 337500,
    breakdown: { rate: 7.5, base: 4500000 },
  };

  it("accepts valid input", () => {
    const result = saveCalculationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with all optional fields", () => {
    const result = saveCalculationSchema.safeParse({
      ...validInput,
      calculation_date: "2025-06-15",
      deductions: 500000,
      effective_rate: 7.5,
      is_final: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid tax_type", () => {
    const result = saveCalculationSchema.safeParse({
      ...validInput,
      tax_type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects tax_year below 2000", () => {
    const result = saveCalculationSchema.safeParse({
      ...validInput,
      tax_year: 1999,
    });
    expect(result.success).toBe(false);
  });

  it("rejects tax_year above 2100", () => {
    const result = saveCalculationSchema.safeParse({
      ...validInput,
      tax_year: 2101,
    });
    expect(result.success).toBe(false);
  });

  it("accepts boundary years (2000 and 2100)", () => {
    expect(
      saveCalculationSchema.safeParse({ ...validInput, tax_year: 2000 })
        .success,
    ).toBe(true);
    expect(
      saveCalculationSchema.safeParse({ ...validInput, tax_year: 2100 })
        .success,
    ).toBe(true);
  });

  it("rejects negative gross_amount", () => {
    const result = saveCalculationSchema.safeParse({
      ...validInput,
      gross_amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative taxable_amount", () => {
    const result = saveCalculationSchema.safeParse({
      ...validInput,
      taxable_amount: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative tax_due", () => {
    const result = saveCalculationSchema.safeParse({
      ...validInput,
      tax_due: -50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative deductions", () => {
    const result = saveCalculationSchema.safeParse({
      ...validInput,
      deductions: -100,
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero amounts", () => {
    const result = saveCalculationSchema.safeParse({
      ...validInput,
      gross_amount: 0,
      taxable_amount: 0,
      tax_due: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    expect(saveCalculationSchema.safeParse({}).success).toBe(false);
    expect(saveCalculationSchema.safeParse({ tax_type: "vat" }).success).toBe(
      false,
    );
  });

  it("rejects invalid calculation_date format", () => {
    const result = saveCalculationSchema.safeParse({
      ...validInput,
      calculation_date: "15/06/2025",
    });
    expect(result.success).toBe(false);
  });

  it("rejects effective_rate over 100", () => {
    const result = saveCalculationSchema.safeParse({
      ...validInput,
      effective_rate: 150,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCalculationSchema", () => {
  it("accepts valid partial update", () => {
    const result = updateCalculationSchema.safeParse({
      gross_amount: 6000000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts multiple fields update", () => {
    const result = updateCalculationSchema.safeParse({
      gross_amount: 6000000,
      tax_due: 450000,
      breakdown: { rate: 7.5 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty object (no valid fields)", () => {
    const result = updateCalculationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects negative amounts", () => {
    expect(
      updateCalculationSchema.safeParse({ gross_amount: -1 }).success,
    ).toBe(false);
    expect(updateCalculationSchema.safeParse({ tax_due: -100 }).success).toBe(
      false,
    );
  });
});
