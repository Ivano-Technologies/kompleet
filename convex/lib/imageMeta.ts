/**
 * IVA-185: tiny image sniffing for business logos. No Convex or Node imports,
 * so it runs in Convex functions, the Next.js server and tests alike.
 */

export type ImageMeta = {
  type: "image/png" | "image/jpeg";
  width: number;
  height: number;
};

function u16be(b: Uint8Array, i: number): number {
  return (b[i]! << 8) | b[i + 1]!;
}

function u32be(b: Uint8Array, i: number): number {
  return ((b[i]! << 24) >>> 0) + (b[i + 1]! << 16) + (b[i + 2]! << 8) + b[i + 3]!;
}

/** Read type and pixel size from PNG or JPEG bytes. Anything else returns null. */
export function sniffImage(bytes: Uint8Array): ImageMeta | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A, then the IHDR chunk.
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[12] === 0x49 &&
    bytes[13] === 0x48 &&
    bytes[14] === 0x44 &&
    bytes[15] === 0x52
  ) {
    const width = u32be(bytes, 16);
    const height = u32be(bytes, 20);
    if (width > 0 && height > 0) return { type: "image/png", width, height };
    return null;
  }
  // JPEG: FF D8, then walk segments to the first SOFn marker.
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = bytes[i + 1]!;
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      const length = u16be(bytes, i + 2);
      const isSof =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;
      if (isSof) {
        const height = u16be(bytes, i + 5);
        const width = u16be(bytes, i + 7);
        if (width > 0 && height > 0) return { type: "image/jpeg", width, height };
        return null;
      }
      if (length < 2) return null;
      i += 2 + length;
    }
  }
  return null;
}
