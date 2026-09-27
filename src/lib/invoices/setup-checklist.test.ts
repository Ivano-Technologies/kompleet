import { describe, expect, it } from "vitest";
import {
  applySignupContactSeed,
  emptyBusinessProfile,
  type BusinessProfile,
} from "./profiles";
import {
  CHECKLIST_ITEM_COUNT,
  checklistDoneCount,
  checklistItems,
  checklistSurface,
  isAddressDone,
  isContactDone,
  isSetupPermanentlyComplete,
  isTaxDone,
  readStorageFlag,
  writeStorageFlag,
} from "./setup-checklist";

function profile(partial: Partial<BusinessProfile> = {}): BusinessProfile {
  return { ...emptyBusinessProfile(), ...partial };
}

describe("IVA-84 checklist progress rules", () => {
  it("counts legalName, address (line1+city), contact (email|phone), and tax (tin|vat)", () => {
    expect(checklistDoneCount(profile())).toBe(0);
    expect(checklistDoneCount(profile({ legalName: "Lekki Crafts Ltd" }))).toBe(1);
    expect(
      checklistDoneCount(
        profile({ legalName: "Lekki Crafts Ltd", addressLine1: "14 Marina" }),
      ),
    ).toBe(1);
    expect(
      checklistDoneCount(
        profile({
          legalName: "Lekki Crafts Ltd",
          addressLine1: "14 Marina",
          city: "Lagos",
        }),
      ),
    ).toBe(2);
    expect(
      checklistDoneCount(
        profile({
          legalName: "Lekki Crafts Ltd",
          addressLine1: "14 Marina",
          city: "Lagos",
          email: "billing@lekkicrafts.ng",
        }),
      ),
    ).toBe(3);
    expect(
      checklistDoneCount(
        profile({
          legalName: "Lekki Crafts Ltd",
          addressLine1: "14 Marina",
          city: "Lagos",
          phone: "+2348012345678",
          tin: "01234567-0001",
        }),
      ),
    ).toBe(4);
    expect(CHECKLIST_ITEM_COUNT).toBe(4);
    expect(checklistItems(profile()).map((item) => item.id)).toEqual([
      "legalName",
      "address",
      "contact",
      "tax",
    ]);
  });

  it("treats contact and tax as OR fields and never counts logo", () => {
    expect(isContactDone(profile({ email: "a@b.com" }))).toBe(true);
    expect(isContactDone(profile({ phone: "0800" }))).toBe(true);
    expect(isContactDone(profile())).toBe(false);
    expect(isTaxDone(profile({ vatNumber: "VAT-1" }))).toBe(true);
    expect(isTaxDone(profile({ tin: "1" }))).toBe(true);
    expect(isAddressDone(profile({ addressLine1: "14 Marina" }))).toBe(false);
    expect(isAddressDone(profile({ addressLine1: "14 Marina", city: "Lagos" }))).toBe(
      true,
    );
    expect(JSON.stringify(checklistItems(profile()))).not.toMatch(/logo/i);
  });

  it("counts signup/account email as contact for the 3-of-4 tax-skipped complete moment", () => {
    const coreOnly = profile({
      legalName: "Lekki Crafts Ltd",
      addressLine1: "14 Marina",
      city: "Lagos",
    });
    expect(checklistDoneCount(coreOnly)).toBe(2);
    const seeded = applySignupContactSeed(coreOnly, {
      email: "billing@lekkicrafts.ng",
    });
    expect(checklistDoneCount(seeded)).toBe(3);
    expect(checklistItems(seeded).find((item) => item.id === "contact")?.done).toBe(
      true,
    );
    expect(checklistItems(seeded).find((item) => item.id === "tax")?.done).toBe(
      false,
    );
    expect(
      applySignupContactSeed(coreOnly, {
        email: "support@ivanotechnologies.com",
      }).email,
    ).toBe("");
  });

  it("permanently completes when legalName + addressLine1 + city are set (email optional)", () => {
    expect(
      isSetupPermanentlyComplete(
        profile({
          legalName: "Lekki Crafts Ltd",
          addressLine1: "14 Marina",
          city: "Lagos",
        }),
      ),
    ).toBe(true);
    expect(
      isSetupPermanentlyComplete(
        profile({ legalName: "Lekki Crafts Ltd", addressLine1: "14 Marina" }),
      ),
    ).toBe(false);
  });
});

describe("IVA-84 checklist dismiss surfaces", () => {
  const incomplete = profile();
  const namedOnly = profile({ legalName: "Lekki Crafts Ltd" });
  const complete = profile({
    legalName: "Lekki Crafts Ltd",
    addressLine1: "14 Marina",
    city: "Lagos",
  });

  it("shows the soft card until dismissed or permanently complete", () => {
    expect(
      checklistSurface({
        profile: incomplete,
        softDismissed: false,
        bannerSessionDismissed: false,
        completeAck: false,
        sawIncomplete: true,
      }),
    ).toBe("card");
    expect(
      checklistSurface({
        profile: namedOnly,
        softDismissed: false,
        bannerSessionDismissed: false,
        completeAck: false,
        sawIncomplete: true,
      }),
    ).toBe("card");
  });

  it("soft-dismisses to an info banner only while legalName is empty", () => {
    expect(
      checklistSurface({
        profile: incomplete,
        softDismissed: true,
        bannerSessionDismissed: false,
        completeAck: false,
        sawIncomplete: true,
      }),
    ).toBe("banner");
    expect(
      checklistSurface({
        profile: namedOnly,
        softDismissed: true,
        bannerSessionDismissed: false,
        completeAck: false,
        sawIncomplete: true,
      }),
    ).toBe("hidden");
  });

  it("hides the banner only in-memory after dismiss; reload (flag reset) shows it again", () => {
    expect(
      checklistSurface({
        profile: incomplete,
        softDismissed: true,
        bannerSessionDismissed: true,
        completeAck: false,
        sawIncomplete: true,
      }),
    ).toBe("hidden");
    expect(
      checklistSurface({
        profile: incomplete,
        softDismissed: true,
        bannerSessionDismissed: false,
        completeAck: false,
        sawIncomplete: true,
      }),
    ).toBe("banner");
  });

  it("hides card + banner forever once the IVA-82 complete-profile rule is met", () => {
    expect(
      checklistSurface({
        profile: complete,
        softDismissed: false,
        bannerSessionDismissed: false,
        completeAck: false,
        sawIncomplete: false,
      }),
    ).toBe("hidden");
    expect(
      checklistSurface({
        profile: complete,
        softDismissed: true,
        bannerSessionDismissed: false,
        completeAck: false,
        sawIncomplete: false,
      }),
    ).toBe("hidden");
  });

  it("shows the complete moment only after the user saw the incomplete card this session", () => {
    expect(
      checklistSurface({
        profile: complete,
        softDismissed: false,
        bannerSessionDismissed: false,
        completeAck: false,
        sawIncomplete: true,
      }),
    ).toBe("complete");
    expect(
      checklistSurface({
        profile: complete,
        softDismissed: false,
        bannerSessionDismissed: false,
        completeAck: true,
        sawIncomplete: true,
      }),
    ).toBe("hidden");
  });

  it("persists dismiss flags in storage without a Convex schema", () => {
    const store = new Map<string, string>();
    const memory = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    expect(readStorageFlag(memory, "k")).toBe(false);
    writeStorageFlag(memory, "k");
    expect(readStorageFlag(memory, "k")).toBe(true);
  });
});
