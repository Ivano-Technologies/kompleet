import ExcelJS from "exceljs";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  AlignmentType,
  WidthType,
} from "docx";
import archiver from "archiver";
import { createServerClient as createClient } from "@/lib/supabase/server";

// =====================================================
// CSV Export
// =====================================================

// Shared data fetcher — used by individual exports and bulk ZIP
async function fetchTransactions(userId: string, taxYear?: number) {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("*, categories(name)")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false });

  if (taxYear) {
    // Filter by transaction_date year range — avoids dependency on generated column
    query = query
      .gte("transaction_date", `${taxYear}-01-01`)
      .lte("transaction_date", `${taxYear}-12-31`);
  }

  const { data: transactions, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return transactions || [];
}

export async function exportTransactionsCSV(
  userId: string,
  taxYear?: number,
  preloadedData?: any[],
) {
  const transactions =
    preloadedData ?? (await fetchTransactions(userId, taxYear));

  // Generate CSV
  const headers = [
    "Date",
    "Type",
    "Category",
    "Description",
    "Amount",
    "Tax Year",
  ];
  const rows =
    transactions?.map((t) => [
      t.transaction_date || "",
      t.transaction_type || "",
      (t.categories as any)?.name || "",
      t.description || "",
      t.amount?.toString() || "0",
      t.tax_year?.toString() || "",
    ]) || [];

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return Buffer.from(csv, "utf-8");
}

// =====================================================
// Excel Export
// =====================================================

export async function exportTransactionsExcel(
  userId: string,
  taxYear?: number,
  preloadedData?: any[],
) {
  const transactions =
    preloadedData ?? (await fetchTransactions(userId, taxYear));

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "KOMPLEET Platform";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Transactions");

  // Add header row
  worksheet.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Type", key: "type", width: 10 },
    { header: "Category", key: "category", width: 20 },
    { header: "Description", key: "description", width: 30 },
    { header: "Amount (₦)", key: "amount", width: 15 },
    { header: "Tax Year", key: "tax_year", width: 10 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0A6847" }, // Nigerian green
  };
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  // Add data rows
  transactions?.forEach((t) => {
    worksheet.addRow({
      date: t.transaction_date || "",
      type: t.transaction_type || "",
      category: (t.categories as any)?.name || "",
      description: t.description || "",
      amount: t.amount || 0,
      tax_year: t.tax_year || "",
    });
  });

  // Format amount column as currency
  worksheet.getColumn("amount").numFmt = "₦#,##0.00";

  // Add filters
  worksheet.autoFilter = {
    from: "A1",
    to: "F1",
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// =====================================================
// Word Document Export
// =====================================================

export async function exportFinancialStatementWord(
  userId: string,
  taxYear: number,
  statementType: "balance_sheet" | "pnl" | "tax_summary",
  preloadedData?: any[],
) {
  const transactions =
    preloadedData ?? (await fetchTransactions(userId, taxYear));

  // Calculate totals
  const income =
    transactions
      ?.filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const expenses =
    transactions
      ?.filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const netIncome = income - expenses;
  const taxLiability = Math.max(0, netIncome * 0.2); // Simplified 20% tax

  let doc: Document;

  if (statementType === "balance_sheet") {
    doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "BALANCE SHEET",
              heading: "Heading1",
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: `Tax Year: ${taxYear}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: "Generated by KOMPLEET Platform",
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "ASSETS", bold: true }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Amount (₦)", bold: true }),
                          ],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Cash and Bank")],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: income.toLocaleString("en-NG"),
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Total Assets", bold: true }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: income.toLocaleString("en-NG"),
                              bold: true,
                            }),
                          ],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "LIABILITIES", bold: true }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: "", bold: true })],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Tax Payable")] }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: taxLiability.toLocaleString("en-NG"),
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Total Liabilities",
                              bold: true,
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: taxLiability.toLocaleString("en-NG"),
                              bold: true,
                            }),
                          ],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "NET WORTH", bold: true }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: (income - taxLiability).toLocaleString(
                                "en-NG",
                              ),
                              bold: true,
                            }),
                          ],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        },
      ],
    });
  } else if (statementType === "pnl") {
    doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "PROFIT & LOSS STATEMENT",
              heading: "Heading1",
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: `Tax Year: ${taxYear}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: "Generated by KOMPLEET Platform",
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Description", bold: true }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Amount (₦)", bold: true }),
                          ],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Total Income")],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: income.toLocaleString("en-NG"),
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Total Expenses")],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: `(${expenses.toLocaleString("en-NG")})`,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Net Income", bold: true }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: netIncome.toLocaleString("en-NG"),
                              bold: true,
                            }),
                          ],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Tax Liability (20%)")],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: `(${taxLiability.toLocaleString("en-NG")})`,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Net Profit After Tax",
                              bold: true,
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: (netIncome - taxLiability).toLocaleString(
                                "en-NG",
                              ),
                              bold: true,
                            }),
                          ],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        },
      ],
    });
  } else {
    // Tax Summary
    doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "TAX SUMMARY",
              heading: "Heading1",
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: `Tax Year: ${taxYear}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: "Generated by KOMPLEET Platform",
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: "Item", bold: true })],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Amount (₦)", bold: true }),
                          ],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Gross Income")],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: income.toLocaleString("en-NG"),
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Allowable Deductions")],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: expenses.toLocaleString("en-NG"),
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Taxable Income", bold: true }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: netIncome.toLocaleString("en-NG"),
                              bold: true,
                            }),
                          ],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Tax Rate")] }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "20%",
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Tax Payable", bold: true }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: taxLiability.toLocaleString("en-NG"),
                              bold: true,
                            }),
                          ],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        },
      ],
    });
  }

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

// =====================================================
// Bulk Export (ZIP)
// =====================================================

export async function createBulkExportZIP(
  userId: string,
  taxYear?: number,
): Promise<Buffer> {
  // Fetch transactions ONCE — eliminates N+1 query (was 3-5 separate DB calls)
  const transactions = await fetchTransactions(userId, taxYear);

  return new Promise(async (resolve, reject) => {
    try {
      const archive = archiver("zip", { zlib: { level: 9 } });
      const chunks: Buffer[] = [];

      archive.on("data", (chunk) => chunks.push(chunk));
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", (err) => reject(err));

      // Add transactions CSV (using preloaded data)
      const csvBuffer = await exportTransactionsCSV(
        userId,
        taxYear,
        transactions,
      );
      archive.append(csvBuffer, { name: "transactions.csv" });

      // Add transactions Excel (using preloaded data)
      const excelBuffer = await exportTransactionsExcel(
        userId,
        taxYear,
        transactions,
      );
      archive.append(excelBuffer, { name: "transactions.xlsx" });

      // Add financial statements (Word) — using preloaded data
      if (taxYear) {
        const balanceSheetBuffer = await exportFinancialStatementWord(
          userId,
          taxYear,
          "balance_sheet",
          transactions,
        );
        archive.append(balanceSheetBuffer, {
          name: `balance_sheet_${taxYear}.docx`,
        });

        const pnlBuffer = await exportFinancialStatementWord(
          userId,
          taxYear,
          "pnl",
          transactions,
        );
        archive.append(pnlBuffer, { name: `profit_loss_${taxYear}.docx` });

        const taxSummaryBuffer = await exportFinancialStatementWord(
          userId,
          taxYear,
          "tax_summary",
          transactions,
        );
        archive.append(taxSummaryBuffer, {
          name: `tax_summary_${taxYear}.docx`,
        });
      }

      // Add manifest
      const manifest = {
        export_date: new Date().toISOString(),
        tax_year: taxYear || "all_years",
        files: [
          "transactions.csv",
          "transactions.xlsx",
          taxYear ? `balance_sheet_${taxYear}.docx` : null,
          taxYear ? `profit_loss_${taxYear}.docx` : null,
          taxYear ? `tax_summary_${taxYear}.docx` : null,
        ].filter(Boolean),
        generated_by: "KOMPLEET Platform",
      };
      archive.append(JSON.stringify(manifest, null, 2), {
        name: "manifest.json",
      });

      // Finalize archive
      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}
