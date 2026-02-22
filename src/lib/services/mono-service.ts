/**
 * Mono API Service
 * Server-side integration with Mono Connect for Nigerian bank data
 * API docs: https://docs.mono.co
 */

const MONO_BASE_URL = "https://api.withmono.com/v2";

function getSecretKey(): string {
  const key = process.env.MONO_SECRET_KEY;
  if (!key) throw new Error("MONO_SECRET_KEY is not configured");
  return key;
}

async function monoFetch<T>(
  endpoint: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${MONO_BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "mono-sec-key": getSecretKey(),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Mono API error (${res.status}): ${errorBody}`);
  }

  return res.json();
}

// --- Types ---

export interface MonoAccountInfo {
  _id: string;
  name: string;
  accountNumber: string;
  currency: string;
  balance: number;
  type: string;
  bvn?: string;
  authMethod?: string;
  institution: {
    name: string;
    bankCode: string;
    type: string;
  };
  created_at: string;
  updated_at: string;
}

export interface MonoTransaction {
  id: string;
  narration: string;
  amount: number; // in kobo (divide by 100 for Naira)
  type: "debit" | "credit";
  balance: number; // in kobo
  date: string;
  category?: string;
}

interface MonoExchangeResponse {
  status: string;
  message: string;
  data: { id: string };
}

interface MonoAccountResponse {
  status: string;
  data: MonoAccountInfo;
  meta?: { data_status: string };
}

interface MonoTransactionsResponse {
  status: string;
  data: MonoTransaction[];
  meta: {
    total: number;
    page: number;
    previous: string | null;
    next: string | null;
  };
}

// --- API Methods ---

/**
 * Exchange the auth code from Mono Connect widget for a permanent account ID
 */
export async function exchangeToken(code: string): Promise<string> {
  const response = await monoFetch<MonoExchangeResponse>("/accounts/auth", {
    method: "POST",
    body: { code },
  });
  return response.data.id;
}

/**
 * Get account information (name, number, bank, balance)
 */
export async function getAccountInfo(
  accountId: string,
): Promise<MonoAccountInfo> {
  const response = await monoFetch<MonoAccountResponse>(
    `/accounts/${accountId}`,
  );
  return response.data;
}

/**
 * Fetch transactions for an account with optional date filtering
 * Note: Mono returns amounts in kobo (1/100 Naira)
 */
export async function getTransactions(
  accountId: string,
  options?: { start?: string; end?: string; limit?: number; page?: number },
): Promise<{
  transactions: MonoTransaction[];
  total: number;
  hasMore: boolean;
}> {
  const params = new URLSearchParams();
  if (options?.start) params.set("start", options.start); // DD-MM-YYYY
  if (options?.end) params.set("end", options.end);
  if (options?.limit) params.set("limit", options.limit.toString());

  const queryString = params.toString();
  const endpoint = `/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ""}`;

  const response = await monoFetch<MonoTransactionsResponse>(endpoint);

  return {
    transactions: response.data,
    total: response.meta.total,
    hasMore: response.meta.next !== null,
  };
}

/**
 * Trigger a manual data sync for an account
 */
export async function syncAccount(accountId: string): Promise<void> {
  await monoFetch(`/accounts/${accountId}/sync`, { method: "POST" });
}

/**
 * Unlink a connected account
 */
export async function unlinkAccount(accountId: string): Promise<void> {
  await monoFetch(`/accounts/${accountId}/unlink`, { method: "POST" });
}
