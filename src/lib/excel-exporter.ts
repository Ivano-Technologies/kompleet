import * as XLSX from "xlsx";
import type { CalculationHistory } from "@/types/calculation-history";

export function exportToExcel(
  calculations: CalculationHistory[],
  filename?: string,
) {
  // Prepare data for Excel
  const excelData = calculations.map((calc) => {
    const getCalculatorName = (type: string) => {
      const names: Record<string, string> = {
        business_tax: "Business Tax",
        individual_income_tax: "Individual Income Tax",
        vat: "VAT",
        capital_allowance: "Capital Allowances",
        stamp_duty: "Stamp Duty",
        property_tax: "Property Tax",
      };
      return names[type] || type;
    };

    const getTotalTax = (results: Record<string, any>) => {
      return (
        results.total_tax ||
        results.total ||
        results.vat ||
        results.stamp_duty ||
        results.wht_amount ||
        0
      );
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
      }).format(value);
    };

    return {
      Date: new Date(calc.created_at).toLocaleString("en-NG"),
      Calculator: getCalculatorName(calc.calculation_type),
      "Input Amount": formatCurrency(
        calc.inputs.turnover ||
          calc.inputs.income ||
          calc.inputs.amount ||
          calc.inputs.asset_cost ||
          calc.inputs.annual_rent ||
          0,
      ),
      "Tax Amount": formatCurrency(getTotalTax(calc.results)),
      "Rule Version": calc.rule_version_id || "N/A",
      "Calculation ID": calc.id,
    };
  });

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Calculations");

  // Set column widths
  worksheet["!cols"] = [
    { wch: 20 }, // Date
    { wch: 25 }, // Calculator
    { wch: 18 }, // Input Amount
    { wch: 18 }, // Tax Amount
    { wch: 20 }, // Rule Version
    { wch: 40 }, // Calculation ID
  ];

  // Generate filename
  const defaultFilename = `KOMPLEET-History-${new Date().toISOString().split("T")[0]}.xlsx`;
  const finalFilename = filename || defaultFilename;

  // Export to file
  XLSX.writeFile(workbook, finalFilename);
}
