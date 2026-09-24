export function newExternalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function toMs(value: string | number | Date | null | undefined):
  | number
  | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value === "number") {
    return value;
  }
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : undefined;
}

export function toMsRequired(
  value: string | number | Date | null | undefined,
  fallback = Date.now(),
): number {
  return toMs(value) ?? fallback;
}
