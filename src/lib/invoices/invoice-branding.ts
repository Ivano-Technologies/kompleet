/**
 * IVA-185: invoice branding rules shared by the in-app preview and the PDF.
 *
 * Invoices show the client business's own logo and name. Kompleet is never
 * the sender. Kompleet appears only
 * in the "Powered by Kompleet" footer. The Ivano V mark sits top right.
 *
 * Invoices are black and white only. The business logo is the one exception.
 */

/** Placeholder shown in the preview when the business has no name yet. */
export const SENDER_NAME_PLACEHOLDER = "Your business name";

/**
 * The Ivano V mark sits at the top right of every invoice, opposite the
 * business, level with the top of the business logo. Shown at its own aspect
 * ratio with no tint or filter. Coco sets the final height: change
 * IVANO_MARK_HEIGHT_PX only.
 *
 * Invoices use a pure greyscale version of Coco's vector (same geometry,
 * viewBox 265.85 x 180): V #000, slash #555, so invoices stay black and white.
 * The app, favicons and BrandLockup keep the slate mark (#5C6673 / #141B26).
 * Source: public/brand/ivano-mark-invoice.svg. The PDF draws the same two
 * polygons as vector paths.
 */
/** Greyscale invoice mark colours. */
export const INVOICE_MARK_V = "#000000";
export const INVOICE_MARK_SLASH = "#555555";
export const IVANO_MARK_SRC = "/brand/ivano-mark-invoice.svg";
export const IVANO_MARK_ALT = "Ivano";
export const IVANO_MARK_VIEWBOX = { width: 265.85, height: 180 } as const;
export const IVANO_MARK_HEIGHT_PX = 20;
export const IVANO_MARK_WIDTH_PX =
  (IVANO_MARK_HEIGHT_PX * IVANO_MARK_VIEWBOX.width) / IVANO_MARK_VIEWBOX.height;
/** The mark's polygons in viewBox units, copied from ivano-mark-invoice.svg. */
export const IVANO_MARK_POLYGONS: ReadonlyArray<{
  fill: string;
  points: ReadonlyArray<readonly [number, number]>;
}> = [
  {
    fill: INVOICE_MARK_SLASH,
    points: [
      [0, 0],
      [36, 0],
      [139.92, 180],
      [103.92, 180],
    ],
  },
  {
    fill: INVOICE_MARK_V,
    points: [
      [58, 0],
      [94, 0],
      [161.92, 117.65],
      [229.85, 0],
      [265.85, 0],
      [161.92, 180],
    ],
  },
];
/** CSS px to mm at 96 dpi, so the PDF mark matches the preview size. */
export const pxToMm = (value: number) => (value * 25.4) / 96;

/** The single footer line on the PDF and the preview. */
export const INVOICE_FOOTER_TEXT = "Powered by Kompleet";

/** A logo wider than this aspect ratio (width / height) hides the name beside it. */
export const WIDE_LOGO_RATIO = 3;

/** Logo box limits. Preview in CSS px, PDF in mm (48px is about 13mm). */
export const LOGO_MAX_HEIGHT_PX = 48;
export const LOGO_MAX_WIDTH_PX = 180;
export const LOGO_MAX_HEIGHT_MM = 13;
export const LOGO_MAX_WIDTH_MM = 48;

/** Upload rules for the business logo. */
export const LOGO_MAX_BYTES = 1024 * 1024;
export const LOGO_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"] as const;
/** Types we store. SVG is rasterised to PNG in the browser before upload. */
export const LOGO_STORED_TYPES = ["image/png", "image/jpeg"] as const;

/** Black and white palette for invoices. */
export const INVOICE_BW = {
  background: "#ffffff",
  text: "#000000",
  secondary: "#555555",
  hairline: "#dddddd",
  rule: "#000000",
} as const;

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export type SenderLogo = {
  url: string;
  width?: number;
  height?: number;
};

export type SenderHeader =
  | {
      mode: "logo";
      logo: SenderLogo;
      name: string;
      /** False when there is no name or the logo is wider than 3:1. */
      showName: boolean;
    }
  | { mode: "name"; name: string }
  | { mode: "placeholder"; name: typeof SENDER_NAME_PLACEHOLDER };

function trim(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isWideLogo(width?: number, height?: number): boolean {
  if (!width || !height || width <= 0 || height <= 0) return false;
  return width / height > WIDE_LOGO_RATIO;
}

/**
 * Decide what the sender side of the header shows.
 * Never returns Kompleet as the sender.
 */
export function resolveSenderHeader(input: {
  name?: string | null;
  logoUrl?: string | null;
  logoWidth?: number | null;
  logoHeight?: number | null;
}): SenderHeader {
  const name = trim(input.name);
  const url = trim(input.logoUrl);
  if (url) {
    const width = input.logoWidth ?? undefined;
    const height = input.logoHeight ?? undefined;
    return {
      mode: "logo",
      logo: { url, width, height },
      name,
      showName: Boolean(name) && !isWideLogo(width, height),
    };
  }
  if (name) return { mode: "name", name };
  return { mode: "placeholder", name: SENDER_NAME_PLACEHOLDER };
}

/** Fit a logo inside a box, keeping its aspect ratio. Never crops, never upscales past the box. */
export function fitLogo(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) return { width: maxHeight, height: maxHeight };
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return { width: width * scale, height: height * scale };
}

export type InvoiceSenderParty = {
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
  logoStorageId?: string;
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
};

export function isIssuedInvoice(invoice: {
  status?: string | null;
  is_immutable?: boolean | null;
}): boolean {
  return (
    invoice.status === "issued" ||
    invoice.status === "paid" ||
    invoice.status === "cancelled" ||
    invoice.status === "archived" ||
    Boolean(invoice.is_immutable)
  );
}

function str(row: Record<string, unknown>, key: string): string | undefined {
  const value = row[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function num(row: Record<string, unknown>, key: string): number | undefined {
  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

export function senderPartyFromUnknown(value: unknown): InvoiceSenderParty | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return {
    name: str(row, "name") ?? str(row, "legalName") ?? "",
    addressLine1: str(row, "addressLine1"),
    addressLine2: str(row, "addressLine2"),
    city: str(row, "city"),
    state: str(row, "state"),
    country: str(row, "country"),
    email: str(row, "email"),
    phone: str(row, "phone"),
    tin: str(row, "tin"),
    vatNumber: str(row, "vatNumber"),
    logoStorageId: str(row, "logoStorageId"),
    logoUrl: str(row, "logoUrl"),
    logoWidth: num(row, "logoWidth"),
    logoHeight: num(row, "logoHeight"),
  };
}

/**
 * Pick the sender for an invoice.
 * Issued invoices use the snapshot taken at issue, so later profile or logo
 * changes never alter them. Drafts use the live business profile.
 */
export function resolveInvoiceSender(
  invoice: { status?: string | null; is_immutable?: boolean | null; sender?: unknown },
  liveProfile: unknown,
): InvoiceSenderParty {
  if (isIssuedInvoice(invoice)) {
    return senderPartyFromUnknown(invoice.sender) ?? { name: "" };
  }
  return (
    senderPartyFromUnknown(liveProfile) ??
    senderPartyFromUnknown(invoice.sender) ?? { name: "" }
  );
}
