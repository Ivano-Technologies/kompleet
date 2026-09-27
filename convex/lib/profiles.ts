import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { newExternalId } from "./ids";

export const DEFAULT_COUNTRY = "NG";

export type BusinessProfileApi = {
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
  complete: boolean;
};

export type ClientApi = {
  id: string;
  legal_name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  tin: string | null;
  entity_type: string | null;
  status: string;
  used_on_issued: boolean;
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

export function trimToEmpty(value: string | undefined | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function trimToUndef(value: string | undefined | null): string | undefined {
  const trimmed = trimToEmpty(value);
  return trimmed.length > 0 ? trimmed : undefined;
}

export function isValidEmail(value: string): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isProfileComplete(profile: {
  legalName: string;
  addressLine1: string;
  city: string;
}): boolean {
  return (
    trimToEmpty(profile.legalName).length > 0 &&
    trimToEmpty(profile.addressLine1).length > 0 &&
    trimToEmpty(profile.city).length > 0
  );
}

export function toBusinessApi(fields: {
  legalName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  email?: string;
  phone?: string;
  tin?: string;
  vatNumber?: string;
}): BusinessProfileApi {
  const legalName = trimToEmpty(fields.legalName);
  const addressLine1 = trimToEmpty(fields.addressLine1);
  const city = trimToEmpty(fields.city);
  return {
    legalName,
    addressLine1,
    addressLine2: trimToEmpty(fields.addressLine2),
    city,
    state: trimToEmpty(fields.state),
    country: trimToEmpty(fields.country) || DEFAULT_COUNTRY,
    email: trimToEmpty(fields.email),
    phone: trimToEmpty(fields.phone),
    tin: trimToEmpty(fields.tin),
    vatNumber: trimToEmpty(fields.vatNumber),
    complete: isProfileComplete({ legalName, addressLine1, city }),
  };
}

export function seedFromUser(user: Doc<"users">): BusinessProfileApi {
  return toBusinessApi({
    legalName: user.companyName,
    addressLine1: user.companyAddress,
    email: user.email,
    phone: user.phone,
    tin: user.tin,
    country: DEFAULT_COUNTRY,
  });
}

export function mergeSeed(
  stored: Doc<"businessProfiles"> | null,
  user: Doc<"users">,
): BusinessProfileApi {
  const seeded = seedFromUser(user);
  if (!stored) return seeded;
  return toBusinessApi({
    legalName: stored.legalName || seeded.legalName,
    addressLine1: stored.addressLine1 || seeded.addressLine1,
    addressLine2: stored.addressLine2,
    city: stored.city,
    state: stored.state,
    country: stored.country || DEFAULT_COUNTRY,
    email: stored.email || seeded.email,
    phone: stored.phone || seeded.phone,
    tin: stored.tin || seeded.tin,
    vatNumber: stored.vatNumber,
  });
}

export function partyFromBusiness(profile: BusinessProfileApi): PartySnapshot {
  return {
    name: trimToEmpty(profile.legalName),
    addressLine1: trimToUndef(profile.addressLine1),
    addressLine2: trimToUndef(profile.addressLine2),
    city: trimToUndef(profile.city),
    state: trimToUndef(profile.state),
    country: trimToUndef(profile.country) ?? DEFAULT_COUNTRY,
    email: trimToUndef(profile.email),
    phone: trimToUndef(profile.phone),
    tin: trimToUndef(profile.tin),
    vatNumber: trimToUndef(profile.vatNumber),
  };
}

export function partyFromClient(client: Doc<"clients">): PartySnapshot {
  return {
    name: client.legalName,
    addressLine1: trimToUndef(client.addressLine1) ?? trimToUndef(client.address),
    addressLine2: trimToUndef(client.addressLine2),
    city: trimToUndef(client.city),
    state: trimToUndef(client.state),
    country: trimToUndef(client.country) ?? DEFAULT_COUNTRY,
    email: trimToUndef(client.email),
    phone: trimToUndef(client.phone),
    tin: trimToUndef(client.tin),
  };
}

export function customerInfoFromParty(party: PartySnapshot) {
  const address = [
    trimToEmpty(party.addressLine1),
    trimToEmpty(party.addressLine2),
    [trimToEmpty(party.city), trimToEmpty(party.state), trimToEmpty(party.country)]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join("\n");
  return {
    name: party.name,
    email: party.email ?? "",
    phone: party.phone ?? "",
    address: address || undefined,
    tin: party.tin,
    addressLine1: party.addressLine1,
    addressLine2: party.addressLine2,
    city: party.city,
    state: party.state,
    country: party.country,
  };
}

export async function getUserFirmId(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users">,
): Promise<Id<"firms"> | null> {
  const memberships = await ctx.db
    .query("firmMembers")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();
  return memberships[0]?.firmId ?? null;
}

export async function getOrCreateUserFirm(
  ctx: MutationCtx,
  user: Doc<"users">,
): Promise<Id<"firms">> {
  const existing = await getUserFirmId(ctx, user);
  if (existing) return existing;
  const now = Date.now();
  const firmId = await ctx.db.insert("firms", {
    externalId: newExternalId(),
    name: user.companyName || user.fullName || user.name?.trim() || "My firm",
    ownerUserId: user._id,
    ownerExternalId: user.externalId,
    subscriptionTier: "free",
    createdAt: now,
  });
  await ctx.db.insert("firmMembers", {
    firmId,
    userId: user._id,
    userExternalId: user.externalId,
    role: "owner",
  });
  return firmId;
}

export async function loadBusinessProfile(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users">,
): Promise<BusinessProfileApi> {
  const stored = await ctx.db
    .query("businessProfiles")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .unique();
  return mergeSeed(stored, user);
}

export async function clientHasIssuedInvoices(
  ctx: QueryCtx | MutationCtx,
  clientId: Id<"clients">,
): Promise<boolean> {
  const invoices = await ctx.db
    .query("invoices")
    .withIndex("by_client", (q) => q.eq("clientId", clientId))
    .collect();
  return invoices.some(
    (invoice) =>
      invoice.status === "issued" ||
      invoice.status === "paid" ||
      invoice.status === "archived" ||
      invoice.isImmutable,
  );
}

export function toClientApi(
  client: Doc<"clients">,
  usedOnIssued: boolean,
): ClientApi {
  return {
    id: client.externalId,
    legal_name: client.legalName,
    email: client.email ?? "",
    phone: client.phone ?? "",
    addressLine1: client.addressLine1 ?? "",
    addressLine2: client.addressLine2 ?? "",
    city: client.city ?? "",
    state: client.state ?? "",
    country: client.country ?? DEFAULT_COUNTRY,
    tin: client.tin ?? null,
    entity_type: client.entityType ?? null,
    status: client.status,
    used_on_issued: usedOnIssued,
  };
}

