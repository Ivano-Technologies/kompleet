/**
 * File type detection from buffer and filename
 * Supports: PDF, XLSX, XLS, CSV, ZIP
 */

export type FileType = "pdf" | "xlsx" | "xls" | "csv" | "zip" | "unknown";

/**
 * Detect file type from buffer (magic bytes) and filename
 * For ZIP-based formats (XLSX, XLS), use filename extension to disambiguate
 */
export function detectFileType(buffer: Buffer, fileName: string): FileType {
  // For ZIP-based files, check extension first to disambiguate XLSX vs ZIP
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    const ext = fileName.toLowerCase().split(".").pop() || "";
    if (ext === "xlsx") return "xlsx";
    if (ext === "xls") return "xls";
    if (ext === "zip") return "zip";
    // Default to checking content for XLSX
    const bufferStr = buffer.toString("utf8", 0, Math.min(buffer.length, 1000));
    if (bufferStr.includes("xl/") || bufferStr.includes("workbook")) {
      return "xlsx";
    }
    return "zip";
  }

  // Check magic bytes for other formats
  const magicType = detectByMagicBytes(buffer);
  if (magicType !== "unknown") {
    return magicType;
  }

  // Fall back to file extension
  return detectByExtension(fileName);
}

/**
 * Detect file type by magic bytes (file signature)
 */
function detectByMagicBytes(buffer: Buffer): FileType {
  if (buffer.length < 4) {
    return "unknown";
  }

  // PDF: %PDF
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "pdf";
  }

  // ZIP (XLSX, XLS, ZIP): PK\x03\x04
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    // Could be XLSX, XLS, or ZIP
    // XLSX: contains xl/workbook.xml
    // XLS: OLE2 format (different magic)
    // ZIP: generic archive

    // For now, return 'zip' and let the parser handle it
    // We'll detect XLSX vs ZIP by looking for xl/ directory
    const bufferStr = buffer.toString("utf8", 0, Math.min(buffer.length, 1000));
    if (bufferStr.includes("xl/") || bufferStr.includes("workbook")) {
      return "xlsx";
    }
    return "zip";
  }

  // XLS (OLE2 format): D0CF11E0
  if (
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  ) {
    return "xls";
  }

  // CSV: Usually plain text, no magic bytes
  // We'll detect this by extension

  return "unknown";
}

/**
 * Detect file type by file extension
 */
function detectByExtension(fileName: string): FileType {
  const ext = fileName.toLowerCase().split(".").pop() || "";

  switch (ext) {
    case "pdf":
      return "pdf";
    case "xlsx":
      return "xlsx";
    case "xls":
      return "xls";
    case "csv":
      return "csv";
    case "zip":
      return "zip";
    default:
      return "unknown";
  }
}

/**
 * Validate if file type is supported
 */
export function isSupportedFileType(fileType: FileType): boolean {
  return ["pdf", "xlsx", "xls", "csv", "zip"].includes(fileType);
}

/**
 * Get human-readable file type name
 */
export function getFileTypeName(fileType: FileType): string {
  switch (fileType) {
    case "pdf":
      return "PDF";
    case "xlsx":
      return "Excel (XLSX)";
    case "xls":
      return "Excel (XLS)";
    case "csv":
      return "CSV";
    case "zip":
      return "ZIP Archive";
    default:
      return "Unknown";
  }
}
