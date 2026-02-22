/**
 * Hold the last captured receipt image URI so receipt-edit can upload it on save.
 */
let pendingUri: string | null = null;

export function setPendingReceiptUri(uri: string): void {
  pendingUri = uri;
}

export function getPendingReceiptUri(): string | null {
  return pendingUri;
}

export function clearPendingReceiptUri(): void {
  pendingUri = null;
}
