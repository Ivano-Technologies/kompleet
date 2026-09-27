import { describe, expect, it } from "vitest";
import {
  applySignupContactSeed,
  emptyBusinessProfile,
  hasLegalName,
  isBusinessProfileComplete,
  titleFromFile,
} from "./profiles";

describe("IVA-82 profile helpers", () => {
  it("maps a drop filename to a draft title and never treats it as a client", () => {
    expect(titleFromFile("invoice drop flow.pdf")).toBe("invoice drop flow");
    expect(titleFromFile("Blue_Harbour-Q3.png")).toBe("Blue Harbour Q3");
  });

  it("treats legalName as the only Issue hard gate on the profile", () => {
    expect(hasLegalName({ legalName: "Lekki Crafts Ltd" })).toBe(true);
    expect(hasLegalName({ legalName: "  " })).toBe(false);
    expect(
      isBusinessProfileComplete({
        legalName: "Lekki Crafts Ltd",
        addressLine1: "",
        city: "",
      }),
    ).toBe(false);
    expect(
      isBusinessProfileComplete({
        legalName: "Lekki Crafts Ltd",
        addressLine1: "Plot 14 Admiralty Way",
        city: "Lagos",
      }),
    ).toBe(true);
  });

  it("seeds empty contact from the account email and ignores fixture addresses", () => {
    const empty = emptyBusinessProfile();
    expect(
      applySignupContactSeed(empty, { email: "billing@lekkicrafts.ng" }).email,
    ).toBe("billing@lekkicrafts.ng");
    expect(
      applySignupContactSeed(
        { ...empty, email: "keep@lekki.ng" },
        { email: "other@lekki.ng" },
      ).email,
    ).toBe("keep@lekki.ng");
    expect(
      applySignupContactSeed(empty, {
        email: "support@ivanotechnologies.com",
      }).email,
    ).toBe("");
  });
});
