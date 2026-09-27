export type SettingsSection =
  | "general"
  | "business"
  | "clients"
  | "notifications"
  | "preferences"
  | "admin"
  | "legal";

export function parseSettingsSection(value: string | null): SettingsSection | null {
  if (
    value === "general" ||
    value === "business" ||
    value === "clients" ||
    value === "notifications" ||
    value === "preferences" ||
    value === "admin" ||
    value === "legal"
  ) {
    return value;
  }
  if (value === "open" || value === "account") return "general";
  return null;
}
