export function normalizeText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[^\x20-\x7E\n\t]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
