export function joinPersonName(
  first?: string | null,
  last?: string | null,
): string {
  return [first, last]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(" ");
}

export function displayPersonName(input: {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  const full = input.fullName?.trim();
  if (full) return full;
  const joined = joinPersonName(input.firstName, input.lastName);
  if (joined) return joined;
  return input.email?.trim() || "";
}
