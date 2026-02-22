/**
 * Bank Configuration Data
 * Defines parsing rules for 10 major Nigerian banks
 */

export interface BankConfig {
  code: string;
  name: string;
  csvConfig: {
    delimiter: string;
    encoding: string;
    dateColumn: string;
    merchantColumn: string;
    amountColumn?: string; // For single amount column
    debitColumn?: string; // For separate debit/credit columns
    creditColumn?: string;
    balanceColumn: string;
    referenceColumn?: string;
    dateFormat: string; // DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    skipRows: number;
    hasHeader: boolean;
  };
  excelConfig: {
    sheetName: string | number; // Sheet name or index (0-based)
    headerRow: number; // 1-based row number
    dateColumn: string | number; // Column letter or index
    merchantColumn: string | number;
    amountColumn?: string | number;
    debitColumn?: string | number;
    creditColumn?: string | number;
    balanceColumn: string | number;
    referenceColumn?: string | number;
    dateFormat: string;
  };
}

export const BANK_CONFIGS: Record<string, BankConfig> = {
  // GTBank (Guaranty Trust Bank)
  GTB: {
    code: "GTB",
    name: "GTBank",
    csvConfig: {
      delimiter: ",",
      encoding: "utf-8",
      dateColumn: "Date",
      merchantColumn: "Transaction Details",
      debitColumn: "Debit",
      creditColumn: "Credit",
      balanceColumn: "Balance",
      referenceColumn: undefined,
      dateFormat: "DD/MM/YYYY",
      skipRows: 0,
      hasHeader: true,
    },
    excelConfig: {
      sheetName: 0,
      headerRow: 1,
      dateColumn: "A",
      merchantColumn: "B",
      debitColumn: "D",
      creditColumn: "E",
      balanceColumn: "F",
      referenceColumn: undefined,
      dateFormat: "DD/MM/YYYY",
    },
  },

  // Zenith Bank
  ZEN: {
    code: "ZEN",
    name: "Zenith Bank",
    csvConfig: {
      delimiter: ",",
      encoding: "utf-8",
      dateColumn: "Tran Date",
      merchantColumn: "Narration",
      debitColumn: "Debit",
      creditColumn: "Credit",
      balanceColumn: "Balance",
      referenceColumn: "Ref",
      dateFormat: "YYYY-MM-DD",
      skipRows: 0,
      hasHeader: true,
    },
    excelConfig: {
      sheetName: 0,
      headerRow: 1,
      dateColumn: "A",
      merchantColumn: "C",
      debitColumn: "D",
      creditColumn: "E",
      balanceColumn: "F",
      referenceColumn: "G",
      dateFormat: "YYYY-MM-DD",
    },
  },

  // Access Bank
  ACC: {
    code: "ACC",
    name: "Access Bank",
    csvConfig: {
      delimiter: ",",
      encoding: "utf-8",
      dateColumn: "Transaction Date",
      merchantColumn: "Description",
      debitColumn: "Debit",
      creditColumn: "Credit",
      balanceColumn: "Balance",
      referenceColumn: "Reference",
      dateFormat: "DD/MM/YYYY",
      skipRows: 0,
      hasHeader: true,
    },
    excelConfig: {
      sheetName: 0,
      headerRow: 1,
      dateColumn: "A",
      merchantColumn: "B",
      debitColumn: "C",
      creditColumn: "D",
      balanceColumn: "E",
      referenceColumn: "F",
      dateFormat: "DD/MM/YYYY",
    },
  },

  // First Bank of Nigeria
  FBN: {
    code: "FBN",
    name: "First Bank",
    csvConfig: {
      delimiter: ",",
      encoding: "utf-8",
      dateColumn: "Date",
      merchantColumn: "Narration",
      debitColumn: "Debit",
      creditColumn: "Credit",
      balanceColumn: "Balance",
      referenceColumn: "Ref No",
      dateFormat: "DD-MM-YYYY",
      skipRows: 0,
      hasHeader: true,
    },
    excelConfig: {
      sheetName: 0,
      headerRow: 1,
      dateColumn: "A",
      merchantColumn: "B",
      debitColumn: "C",
      creditColumn: "D",
      balanceColumn: "E",
      referenceColumn: "F",
      dateFormat: "DD-MM-YYYY",
    },
  },

  // United Bank for Africa (UBA)
  UBA: {
    code: "UBA",
    name: "UBA",
    csvConfig: {
      delimiter: ",",
      encoding: "utf-8",
      dateColumn: "Transaction Date",
      merchantColumn: "Transaction Details",
      debitColumn: "Debit",
      creditColumn: "Credit",
      balanceColumn: "Balance",
      referenceColumn: "Reference",
      dateFormat: "DD/MM/YYYY",
      skipRows: 0,
      hasHeader: true,
    },
    excelConfig: {
      sheetName: 0,
      headerRow: 1,
      dateColumn: "A",
      merchantColumn: "B",
      debitColumn: "C",
      creditColumn: "D",
      balanceColumn: "E",
      referenceColumn: "F",
      dateFormat: "DD/MM/YYYY",
    },
  },

  // Ecobank
  ECO: {
    code: "ECO",
    name: "Ecobank",
    csvConfig: {
      delimiter: ",",
      encoding: "utf-8",
      dateColumn: "Date",
      merchantColumn: "Description",
      debitColumn: "Debit",
      creditColumn: "Credit",
      balanceColumn: "Balance",
      referenceColumn: "Ref",
      dateFormat: "DD/MM/YYYY",
      skipRows: 0,
      hasHeader: true,
    },
    excelConfig: {
      sheetName: 0,
      headerRow: 1,
      dateColumn: "A",
      merchantColumn: "B",
      debitColumn: "C",
      creditColumn: "D",
      balanceColumn: "E",
      referenceColumn: "F",
      dateFormat: "DD/MM/YYYY",
    },
  },

  // Stanbic IBTC
  SBT: {
    code: "SBT",
    name: "Stanbic IBTC",
    csvConfig: {
      delimiter: ",",
      encoding: "utf-8",
      dateColumn: "Transaction Date",
      merchantColumn: "Narration",
      debitColumn: "Debit",
      creditColumn: "Credit",
      balanceColumn: "Balance",
      referenceColumn: "Reference",
      dateFormat: "YYYY-MM-DD",
      skipRows: 0,
      hasHeader: true,
    },
    excelConfig: {
      sheetName: 0,
      headerRow: 1,
      dateColumn: "A",
      merchantColumn: "B",
      debitColumn: "C",
      creditColumn: "D",
      balanceColumn: "E",
      referenceColumn: "F",
      dateFormat: "YYYY-MM-DD",
    },
  },

  // Fidelity Bank
  FID: {
    code: "FID",
    name: "Fidelity Bank",
    csvConfig: {
      delimiter: ",",
      encoding: "utf-8",
      dateColumn: "Date",
      merchantColumn: "Description",
      debitColumn: "Debit",
      creditColumn: "Credit",
      balanceColumn: "Balance",
      referenceColumn: "Reference Number",
      dateFormat: "DD/MM/YYYY",
      skipRows: 0,
      hasHeader: true,
    },
    excelConfig: {
      sheetName: 0,
      headerRow: 1,
      dateColumn: "A",
      merchantColumn: "B",
      debitColumn: "C",
      creditColumn: "D",
      balanceColumn: "E",
      referenceColumn: "F",
      dateFormat: "DD/MM/YYYY",
    },
  },

  // Union Bank
  UNB: {
    code: "UNB",
    name: "Union Bank",
    csvConfig: {
      delimiter: ",",
      encoding: "utf-8",
      dateColumn: "Transaction Date",
      merchantColumn: "Narration",
      debitColumn: "Debit",
      creditColumn: "Credit",
      balanceColumn: "Balance",
      referenceColumn: "Ref",
      dateFormat: "DD-MM-YYYY",
      skipRows: 0,
      hasHeader: true,
    },
    excelConfig: {
      sheetName: 0,
      headerRow: 1,
      dateColumn: "A",
      merchantColumn: "B",
      debitColumn: "C",
      creditColumn: "D",
      balanceColumn: "E",
      referenceColumn: "F",
      dateFormat: "DD-MM-YYYY",
    },
  },

  // Moniepoint (formerly TeamApt)
  MON: {
    code: "MON",
    name: "Moniepoint",
    csvConfig: {
      delimiter: ",",
      encoding: "utf-8",
      dateColumn: "Date",
      merchantColumn: "Narration",
      debitColumn: "Debit",
      creditColumn: "Credit",
      balanceColumn: "Balance",
      referenceColumn: "Reference",
      dateFormat: "DD/MM/YYYY",
      skipRows: 0,
      hasHeader: true,
    },
    excelConfig: {
      sheetName: 0,
      headerRow: 1,
      dateColumn: "A",
      merchantColumn: "B",
      debitColumn: "C",
      creditColumn: "D",
      balanceColumn: "E",
      referenceColumn: "F",
      dateFormat: "DD/MM/YYYY",
    },
  },

  // Wema Bank
  WEM: {
    code: "WEM",
    name: "Wema Bank",
    csvConfig: {
      delimiter: ",",
      encoding: "utf-8",
      dateColumn: "Date",
      merchantColumn: "Details",
      debitColumn: "Debit",
      creditColumn: "Credit",
      balanceColumn: "Balance",
      referenceColumn: undefined,
      dateFormat: "DD/MM/YYYY",
      skipRows: 0,
      hasHeader: true,
    },
    excelConfig: {
      sheetName: 0,
      headerRow: 1,
      dateColumn: "A",
      merchantColumn: "B",
      debitColumn: "C",
      creditColumn: "D",
      balanceColumn: "E",
      referenceColumn: undefined,
      dateFormat: "DD/MM/YYYY",
    },
  },
};

// Helper function to get bank config
export function getBankConfig(bankCode: string): BankConfig | undefined {
  return BANK_CONFIGS[bankCode.toUpperCase()];
}

// List of all supported banks
export const SUPPORTED_BANKS = Object.values(BANK_CONFIGS).map((config) => ({
  code: config.code,
  name: config.name,
}));
