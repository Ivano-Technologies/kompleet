// Shared API types matching Master Coordination Document v1.0.0

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// Financial Record types
export interface FinancialRecord {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  date: string;
  category: string;
  description?: string;
  attachments?: string[];
  taxCode?: string;
  vatAmount?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecordRequest {
  type: 'income' | 'expense';
  amount: number;
  date: string;
  category: string;
  description?: string;
  attachments?: string[];
  taxCode?: string;
  vatAmount?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateRecordRequest extends Partial<CreateRecordRequest> {}

// Filing types
export interface Filing {
  id: string;
  userId: string;
  type: 'VAT' | 'CIT' | 'WHT' | 'PAYE';
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  period: {
    year: number;
    month?: number;
    quarter?: number;
  };
  recordIds: string[];
  totalAmount: number;
  taxAmount: number;
  nrsReference?: string;
  submittedAt?: string;
  approvedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Dashboard types
export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  vatCollected: number;
  vatPaid: number;
  pendingFilings: number;
  recentRecords: FinancialRecord[];
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

// Bank types
export interface BankAccount {
  id: string;
  userId: string;
  provider: 'mono' | 'okra' | 'plaid';
  accountNumber: string;
  accountName: string;
  bankName: string;
  balance?: number;
  currency: string;
  status: 'active' | 'disconnected' | 'error';
  lastSyncedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  bankAccountId: string;
  externalId: string;
  type: 'debit' | 'credit';
  amount: number;
  currency: string;
  description?: string;
  date: string;
  category?: string;
  categoryConfidence?: number;
  linkedRecordId?: string;
  isCategorized: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Invoice types
export interface Customer {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  };
  tin?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  customerId: string;
  invoiceNumber: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode?: string;
    };
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    amount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  sentAt?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
