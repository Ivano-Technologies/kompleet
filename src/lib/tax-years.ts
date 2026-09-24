/** Calendar fallback used when a user has no `userTaxYears` rows yet. */
export function defaultTaxYears(now = new Date()): number[] {
  const currentYear = now.getFullYear();
  return [currentYear - 2, currentYear - 1, currentYear];
}
