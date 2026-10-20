import { describe, expect, it } from "vitest";
import type { Doc } from "../_generated/dataModel";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mergeSeed, partyFromBusiness, toBusinessApi } from "./profiles";

function user(companyName: string): Doc<"users"> {
  return {
    _id: "users:1" as Doc<"users">["_id"],
    _creationTime: 1,
    externalId: "u1",
    email: "ivanonigeria@gmail.com",
    companyName,
    companyAddress: "14 Marina Road",
    phone: "0800",
    tin: "123",
    createdAt: 1,
    updatedAt: 1,
  } as Doc<"users">;
}

function stored(legalName: string): Doc<"businessProfiles"> {
  return {
    _id: "businessProfiles:1" as Doc<"businessProfiles">["_id"],
    _creationTime: 1,
    userId: "users:1" as Doc<"users">["_id"],
    userExternalId: "u1",
    legalName,
    addressLine1: "14 Marina Road",
    city: "Lagos",
    country: "NG",
    createdAt: 1,
    updatedAt: 1,
  } as Doc<"businessProfiles">;
}

describe("IVA-82 business profile persist/read", () => {
  it("keeps an explicitly empty legalName instead of re-seeding companyName", () => {
    const profile = mergeSeed(stored(""), user("Ivano Smoke Co Ltd"));
    expect(profile.legalName).toBe("");
    expect(profile.complete).toBe(false);
  });

  it("still seeds from the user when no stored profile exists", () => {
    const profile = mergeSeed(null, user("Ivano Smoke Co Ltd"));
    expect(profile.legalName).toBe("Ivano Smoke Co Ltd");
  });

  it("treats a persisted empty string as empty, not missing", () => {
    const api = toBusinessApi({ legalName: "", addressLine1: "14 Marina", city: "Lagos" });
    expect(api.legalName).toBe("");
    expect(api.complete).toBe(false);
  });
});

describe("IVA-185 logo snapshot on issue", () => {
  const storageId = "kg2logo" as Doc<"businessProfiles">["logoStorageId"] & string;

  it("copies the logo storage id, URL and size into the sender snapshot", () => {
    const profile = toBusinessApi({
      legalName: "Ada Foods Ltd",
      addressLine1: "14 Marina Road",
      city: "Lagos",
      logoStorageId: storageId as never,
      logoUrl: "https://example.convex.cloud/api/storage/kg2logo",
      logoWidth: 400,
      logoHeight: 200,
    });
    const snapshot = partyFromBusiness(profile);
    expect(snapshot.name).toBe("Ada Foods Ltd");
    expect(snapshot.logoStorageId).toBe(storageId);
    expect(snapshot.logoUrl).toBe("https://example.convex.cloud/api/storage/kg2logo");
    expect(snapshot.logoWidth).toBe(400);
    expect(snapshot.logoHeight).toBe(200);
  });

  it("leaves logo fields out of the snapshot when there is no logo", () => {
    const snapshot = partyFromBusiness(toBusinessApi({ legalName: "Ada Foods Ltd" }));
    expect(snapshot).not.toHaveProperty("logoUrl");
    expect(snapshot).not.toHaveProperty("logoStorageId");
  });

  it("mergeSeed carries the stored logo and resolved URL", () => {
    const row = { ...stored("Ada Foods Ltd"), logoStorageId: storageId, logoWidth: 10, logoHeight: 5 } as Doc<"businessProfiles">;
    const profile = mergeSeed(row, user("x"), "https://example.convex.cloud/api/storage/kg2logo");
    expect(profile.logoStorageId).toBe(storageId);
    expect(profile.logoUrl).toBe("https://example.convex.cloud/api/storage/kg2logo");
  });

  it("issueMine snapshots via partyFromBusiness and blocks issuing without a name", () => {
    const source = readFileSync(resolve(process.cwd(), "convex/invoices.ts"), "utf8");
    const issueStart = source.includes("export async function issueMineHandler")
      ? source.indexOf("export async function issueMineHandler")
      : source.indexOf("export const issueMine");
    const issue = source.slice(issueStart, source.indexOf("export const removeMine"));
    expect(issue).toMatch(/if \(!profile\.legalName\.trim\(\)\)/);
    expect(issue).toMatch(/const senderSnapshot = partyFromBusiness\(profile\)/);
    expect(issue).toMatch(/senderSnapshot,/);
  });
});
