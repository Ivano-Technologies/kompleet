import { describe, expect, it } from "vitest";
import {
  INVOICE_FOOTER_TEXT,
  IVANO_MARK_HEIGHT_PX,
  IVANO_MARK_WIDTH_PX,
  SENDER_NAME_PLACEHOLDER,
  fitLogo,
  isWideLogo,
  resolveInvoiceSender,
  resolveSenderHeader,
} from "./invoice-branding";

const LOGO = "https://shiny-example.convex.cloud/api/storage/abc";

describe("IVA-185 sender header fallback", () => {
  it("logo plus name shows both", () => {
    const header = resolveSenderHeader({ name: "Ada Foods Ltd", logoUrl: LOGO, logoWidth: 200, logoHeight: 200 });
    expect(header).toEqual({
      mode: "logo",
      logo: { url: LOGO, width: 200, height: 200 },
      name: "Ada Foods Ltd",
      showName: true,
    });
  });

  it("hides the name beside a logo wider than 3:1", () => {
    const header = resolveSenderHeader({ name: "Ada Foods Ltd", logoUrl: LOGO, logoWidth: 900, logoHeight: 200 });
    expect(header.mode).toBe("logo");
    expect(header.mode === "logo" && header.showName).toBe(false);
    expect(isWideLogo(300, 100)).toBe(false);
    expect(isWideLogo(301, 100)).toBe(true);
  });

  it("name only shows the name", () => {
    expect(resolveSenderHeader({ name: "  Ada Foods Ltd  " })).toEqual({ mode: "name", name: "Ada Foods Ltd" });
  });

  it("no name shows the neutral placeholder, never KOMPLEET", () => {
    const header = resolveSenderHeader({ name: "  " });
    expect(header).toEqual({ mode: "placeholder", name: SENDER_NAME_PLACEHOLDER });
    expect(SENDER_NAME_PLACEHOLDER).toBe("Your business name");
    expect(JSON.stringify(header)).not.toMatch(/kompleet/i);
  });

  it("fits a logo inside the box without cropping", () => {
    expect(fitLogo(400, 100, 180, 48)).toEqual({ width: 180, height: 45 });
    expect(fitLogo(100, 100, 180, 48)).toEqual({ width: 48, height: 48 });
  });

  it("keeps the footer text and mark size as single constants", () => {
    expect(INVOICE_FOOTER_TEXT).toBe("Powered by Kompleet");
    expect(IVANO_MARK_HEIGHT_PX).toBe(20);
    expect(Math.round(IVANO_MARK_WIDTH_PX)).toBe(30);
  });
});

describe("IVA-185 issued snapshot vs live draft", () => {
  const snapshot = { name: "Old Name Ltd", logoUrl: "https://x.convex.cloud/api/storage/old", logoStorageId: "old" };
  const live = { legalName: "New Name Ltd", logoUrl: "https://x.convex.cloud/api/storage/new" };

  it("issued invoices use the snapshot even after the profile changes", () => {
    const sender = resolveInvoiceSender({ status: "issued", is_immutable: true, sender: snapshot }, live);
    expect(sender.name).toBe("Old Name Ltd");
    expect(sender.logoUrl).toBe(snapshot.logoUrl);
  });

  it("drafts use the live profile", () => {
    const sender = resolveInvoiceSender({ status: "draft", sender: snapshot }, live);
    expect(sender.name).toBe("New Name Ltd");
    expect(sender.logoUrl).toBe(live.logoUrl);
  });

  it("drafts with no profile fall back to the hydrated sender, never KOMPLEET", () => {
    expect(resolveInvoiceSender({ status: "draft", sender: null }, null).name).toBe("");
  });
});
