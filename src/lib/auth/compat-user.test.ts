import { describe, expect, it } from "vitest";
import { profileToCompatUser } from "./compat-user";

const BASE = {
  id: "u1",
  email: "ada@example.com",
  full_name: "Ada Lovelace",
  company_name: "Ada Foods",
};

describe("profileToCompatUser", () => {
  it("maps owner and admin platform roles into app_metadata", () => {
    expect(
      profileToCompatUser({ ...BASE, platform_role: "owner" }).app_metadata.role,
    ).toBe("owner");
    expect(
      profileToCompatUser({ ...BASE, platform_role: "admin" }).app_metadata.role,
    ).toBe("admin");
  });

  it("defaults missing or unknown roles to user", () => {
    expect(profileToCompatUser(BASE).app_metadata.role).toBe("user");
    expect(
      profileToCompatUser({ ...BASE, platform_role: "superuser" }).app_metadata
        .role,
    ).toBe("user");
  });
});
