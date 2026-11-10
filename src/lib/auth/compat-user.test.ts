import { describe, expect, it } from "vitest";
import { profileToCompatUser } from "./compat-user";

const profile = {
  id: "ext-1",
  email: "ada@example.com",
  full_name: "Ada Lovelace",
  company_name: "Ada Ltd",
  created_at: "2026-11-01T00:00:00.000Z",
};

describe("profileToCompatUser", () => {
  it("maps owner and admin platform roles into app_metadata", () => {
    expect(
      profileToCompatUser({ ...profile, platform_role: "owner" }).app_metadata
        .role,
    ).toBe("owner");
    expect(
      profileToCompatUser({ ...profile, platform_role: "admin" }).app_metadata
        .role,
    ).toBe("admin");
  });

  it("defaults missing or unknown roles to user", () => {
    expect(profileToCompatUser(profile).app_metadata.role).toBe("user");
    expect(
      profileToCompatUser({ ...profile, platform_role: "superuser" })
        .app_metadata.role,
    ).toBe("user");
  });

  it("does not lock users out when verification status is unknown", () => {
    const user = profileToCompatUser(profile);
    expect(user.email_confirmed_at).toBe(profile.created_at);
  });

  it("clears confirmation when Convex says the email is unverified", () => {
    const user = profileToCompatUser(profile, {
      verified: false,
      emailVerificationTime: null,
    });
    expect(user.email_confirmed_at).toBe("");
  });

  it("uses emailVerificationTime when Convex says verified", () => {
    const user = profileToCompatUser(profile, {
      verified: true,
      emailVerificationTime: Date.parse("2026-11-09T18:00:00.000Z"),
    });
    expect(user.email_confirmed_at).toBe("2026-11-09T18:00:00.000Z");
  });
});
