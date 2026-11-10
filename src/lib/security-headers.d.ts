export const HSTS_VALUE: string;
export const PERMISSIONS_POLICY_VALUE: string;
export const STATIC_SECURITY_HEADERS: { key: string; value: string }[];

export function createNonce(): string;

export function buildContentSecurityPolicy(options?: {
  nonce?: string;
  isDev?: boolean;
}): string;

export function attachCspRequestHeaders(
  headers: Headers,
  options: { nonce: string; isDev?: boolean },
): string;

export function applySecurityHeaders(
  response: {
    headers: {
      set: (key: string, value: string) => void;
      delete?: (key: string) => void;
    };
  },
  options?: { nonce?: string; isDev?: boolean },
): string;
