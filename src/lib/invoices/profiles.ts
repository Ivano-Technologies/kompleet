export const DEFAULT_COUNTRY = "NG";

export type BusinessProfile = {
  legalName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  email: string;
  phone: string;
  tin: string;
  vatNumber: string;
};

export type ClientProfile = {
  id: string;
  legal_name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  used_on_issued?: boolean;
  archived?: boolean;
};

export type PartySnapshot = {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  email?: string;
  phone?: string;
  tin?: string;
  vatNumber?: string;
};

export const emptyBusinessProfile = (): BusinessProfile => ({
  legalName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: DEFAULT_COUNTRY,
  email: "",
  phone: "",
  tin: "",
  vatNumber: "",
});

export function trimToEmpty(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function trimToNull(value: string | null | undefined): string | undefined {
  const trimmed = trimToEmpty(value);
  return trimmed.length > 0 ? trimmed : undefined;
}

export function isValidEmail(value: string): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function hasLegalName(profile: Pick<BusinessProfile, "legalName">): boolean {
  return trimToEmpty(profile.legalName).length > 0;
}

export function isBusinessProfileComplete(
  profile: Pick<BusinessProfile, "legalName" | "addressLine1" | "city">,
): boolean {
  return (
    hasLegalName(profile) &&
    trimToEmpty(profile.addressLine1).length > 0 &&
    trimToEmpty(profile.city).length > 0
  );
}

export function titleFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return base || "Draft";
}

export function partyFromBusiness(profile: BusinessProfile): PartySnapshot {
  return {
    name: trimToEmpty(profile.legalName),
    addressLine1: trimToNull(profile.addressLine1),
    addressLine2: trimToNull(profile.addressLine2),
    city: trimToNull(profile.city),
    state: trimToNull(profile.state),
    country: trimToNull(profile.country) ?? DEFAULT_COUNTRY,
    email: trimToNull(profile.email),
    phone: trimToNull(profile.phone),
    tin: trimToNull(profile.tin),
    vatNumber: trimToNull(profile.vatNumber),
  };
}

export function partyFromClient(client: ClientProfile): PartySnapshot {
  return {
    name: trimToEmpty(client.legal_name),
    addressLine1: trimToNull(client.addressLine1),
    addressLine2: trimToNull(client.addressLine2),
    city: trimToNull(client.city),
    state: trimToNull(client.state),
    country: trimToNull(client.country) ?? DEFAULT_COUNTRY,
    email: trimToNull(client.email),
    phone: trimToNull(client.phone),
  };
}

export function formatCityLine(party: {
  city?: string;
  state?: string;
  country?: string;
}): string | null {
  const parts = [trimToEmpty(party.city), trimToEmpty(party.state), trimToEmpty(party.country)]
    .filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0] ?? null;
  const city = trimToEmpty(party.city);
  const rest = [trimToEmpty(party.state), trimToEmpty(party.country)].filter(Boolean);
  if (city && rest.length > 0) return `${city}, ${rest.join(", ")}`;
  return parts.join(", ");
}

export function formatContactLine(party: { email?: string; phone?: string }): string | null {
  const parts = [trimToEmpty(party.email), trimToEmpty(party.phone)].filter(Boolean);
  return parts.length > 0 ? parts.join("  ·  ") : null;
}

export function formatAddressBlob(party: PartySnapshot): string {
  return [
    trimToEmpty(party.addressLine1),
    trimToEmpty(party.addressLine2),
    formatCityLine(party) ?? "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function customerInfoFromParty(party: PartySnapshot | null | undefined): {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tin?: string;
} {
  if (!party || !trimToEmpty(party.name)) {
    return { name: "" };
  }
  return {
    name: trimToEmpty(party.name),
    email: trimToNull(party.email),
    phone: trimToNull(party.phone),
    address: formatAddressBlob(party) || undefined,
    tin: trimToNull(party.tin),
  };
}

export function partyFromUnknown(value: unknown): PartySnapshot | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const name =
    typeof row.name === "string"
      ? row.name
      : typeof row.legalName === "string"
        ? row.legalName
        : "";
  if (!trimToEmpty(name) && !trimToEmpty(typeof row.addressLine1 === "string" ? row.addressLine1 : "")) {
    return null;
  }
  return {
    name: trimToEmpty(name),
    addressLine1: typeof row.addressLine1 === "string" ? row.addressLine1 : undefined,
    addressLine2: typeof row.addressLine2 === "string" ? row.addressLine2 : undefined,
    city: typeof row.city === "string" ? row.city : undefined,
    state: typeof row.state === "string" ? row.state : undefined,
    country: typeof row.country === "string" ? row.country : undefined,
    email: typeof row.email === "string" ? row.email : undefined,
    phone: typeof row.phone === "string" ? row.phone : undefined,
    tin: typeof row.tin === "string" ? row.tin : undefined,
    vatNumber:
      typeof row.vatNumber === "string"
        ? row.vatNumber
        : typeof row.vat_number === "string"
          ? row.vat_number
          : undefined,
  };
}
