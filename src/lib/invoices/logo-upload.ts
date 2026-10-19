/**
 * IVA-185: browser side checks for the business logo upload.
 * PNG and JPEG upload as they are. SVG is rasterised to PNG in the browser,
 * so stored logos are always plain bitmaps (no scripts, and jsPDF can embed them).
 */
import {
  LOGO_ACCEPTED_TYPES,
  LOGO_MAX_BYTES,
  LOGO_MAX_HEIGHT_PX,
  LOGO_MAX_WIDTH_PX,
} from "./invoice-branding";

export type LogoProblem = "type" | "size" | null;

const EXT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
};

export function logoFileType(file: { name: string; type: string }): string | null {
  const type = file.type.toLowerCase();
  if ((LOGO_ACCEPTED_TYPES as readonly string[]).includes(type)) return type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TYPES[ext] ?? null;
}

export function checkLogoFile(file: { name: string; type: string; size: number }): LogoProblem {
  if (!logoFileType(file)) return "type";
  if (file.size > LOGO_MAX_BYTES) return "size";
  return null;
}

/** Rasterise an SVG to a PNG at 4x the invoice logo box, keeping its aspect ratio. */
export async function svgToPng(file: Blob): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read SVG"));
      el.src = url;
    });
    const naturalW = img.naturalWidth || LOGO_MAX_WIDTH_PX;
    const naturalH = img.naturalHeight || LOGO_MAX_HEIGHT_PX;
    const scale = Math.min((LOGO_MAX_WIDTH_PX * 4) / naturalW, (LOGO_MAX_HEIGHT_PX * 4) / naturalH);
    const width = Math.max(1, Math.round(naturalW * scale));
    const height = Math.max(1, Math.round(naturalH * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not convert SVG"))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
