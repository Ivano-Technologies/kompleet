/** Export download links expire 7 days after creation. */
export const EXPORT_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function exportExpiresAt(
  createdAt: number,
  storedExpiresAt?: number | null,
): number {
  if (typeof storedExpiresAt === "number" && storedExpiresAt > 0) {
    return storedExpiresAt;
  }
  return createdAt + EXPORT_LINK_TTL_MS;
}

export function exportExpiresAtIso(
  createdAt: number,
  storedExpiresAt?: number | null,
): string {
  return new Date(exportExpiresAt(createdAt, storedExpiresAt)).toISOString();
}
