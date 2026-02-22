/**
 * Encryption detection for PDF, Excel, and ZIP files
 * Identifies if a file requires a password to decrypt
 */

import { FileType } from "./detectFileType";
import { EncryptionInfo } from "./types";

/**
 * Detect if file is encrypted based on file type
 */
export function detectEncryption(
  buffer: Buffer,
  fileType: FileType,
): EncryptionInfo {
  switch (fileType) {
    case "pdf":
      return detectPdfEncryption(buffer);
    case "xlsx":
      return detectExcelEncryption(buffer, "xlsx");
    case "xls":
      return detectExcelEncryption(buffer, "xls");
    case "zip":
      return detectZipEncryption(buffer);
    default:
      return { isEncrypted: false, requiresPassword: false };
  }
}

/**
 * Detect PDF encryption
 * PDF encryption is indicated by /Encrypt dictionary in the file
 */
function detectPdfEncryption(buffer: Buffer): EncryptionInfo {
  try {
    // Convert buffer to string (latin1 preserves byte values)
    const bufferStr = buffer.toString("latin1");

    // Look for /Encrypt dictionary (indicates encryption)
    const isEncrypted = bufferStr.includes("/Encrypt");

    return {
      isEncrypted,
      encryptionType: isEncrypted ? "password" : undefined,
      requiresPassword: isEncrypted,
    };
  } catch {
    return { isEncrypted: false, requiresPassword: false };
  }
}

/**
 * Detect Excel encryption
 * XLSX: ZIP format with possible encryption flags
 * XLS: OLE2 format with encryption flags in header
 */
function detectExcelEncryption(
  buffer: Buffer,
  fileType: "xlsx" | "xls",
): EncryptionInfo {
  try {
    if (fileType === "xlsx") {
      // XLSX is a ZIP file
      // Check for encryption flags in ZIP local file headers
      // Encryption flag is bit 0 of general purpose bit flag (offset 6-7 in local header)

      // Look for local file header signature (PK\x03\x04)
      let offset = 0;
      while (offset < buffer.length - 30) {
        // Check for local file header signature
        if (
          buffer[offset] === 0x50 &&
          buffer[offset + 1] === 0x4b &&
          buffer[offset + 2] === 0x03 &&
          buffer[offset + 3] === 0x04
        ) {
          // Found local file header
          // General purpose bit flag is at offset 6-7
          const gpbf = buffer.readUInt16LE(offset + 6);

          // Bit 0: encryption flag
          if ((gpbf & 0x0001) === 0x0001) {
            return {
              isEncrypted: true,
              encryptionType: "password",
              requiresPassword: true,
            };
          }
        }
        offset++;
      }

      return { isEncrypted: false, requiresPassword: false };
    } else {
      // XLS (OLE2 format)
      // Check OLE2 header for encryption flags
      // OLE2 files start with D0CF11E0
      // Encryption info is in the property set

      // For now, we'll rely on exceljs to handle this
      // exceljs will throw an error if password is required
      return { isEncrypted: false, requiresPassword: false };
    }
  } catch {
    return { isEncrypted: false, requiresPassword: false };
  }
}

/**
 * Detect ZIP encryption
 * ZIP encryption is indicated by encryption flags in local file headers
 */
function detectZipEncryption(buffer: Buffer): EncryptionInfo {
  try {
    // Look for local file header signature (PK\x03\x04)
    let offset = 0;
    while (offset < buffer.length - 30) {
      // Check for local file header signature
      if (
        buffer[offset] === 0x50 &&
        buffer[offset + 1] === 0x4b &&
        buffer[offset + 2] === 0x03 &&
        buffer[offset + 3] === 0x04
      ) {
        // Found local file header
        // General purpose bit flag is at offset 6-7
        const gpbf = buffer.readUInt16LE(offset + 6);

        // Bit 0: encryption flag
        if ((gpbf & 0x0001) === 0x0001) {
          return {
            isEncrypted: true,
            encryptionType: "password",
            requiresPassword: true,
          };
        }
      }
      offset++;
    }

    return { isEncrypted: false, requiresPassword: false };
  } catch {
    return { isEncrypted: false, requiresPassword: false };
  }
}

/**
 * Get human-readable encryption message
 */
export function getEncryptionMessage(encryptionInfo: EncryptionInfo): string {
  if (!encryptionInfo.isEncrypted) {
    return "";
  }

  return "This file is password-protected. Please provide the password to unlock it.";
}
