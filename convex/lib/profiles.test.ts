import { describe, expect, it } from "vitest";
import type { Doc } from "../_generated/dataModel";
import { mergeSeed, toBusinessApi } from "./profiles";

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
