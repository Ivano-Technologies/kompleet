/**
 * Ingestion worker - orchestrates the entire ingestion pipeline
 * Handles file detection, encryption, parsing, normalization, validation
 */

import { detectFileType, isSupportedFileType } from "./detectFileType";
import { detectEncryption } from "./detectEncryption";
import { deduplicateTransactions } from "./deduplicate";
import { sanitizeTransactions } from "./sanitizeForAI";
import { validateTransactions } from "./validate";
import { IngestionRequest, IngestionResponse, ParseResult } from "./types";

/**
 * Main ingestion function
 */
export async function ingestStatement(
  request: IngestionRequest,
  userId: string,
  sourceFileId: string,
): Promise<IngestionResponse> {
  try {
    // 1. Read file buffer
    const buffer = await fileToBuffer(request.file);

    // 2. Detect file type
    const fileType = detectFileType(buffer, request.file.name);

    if (!isSupportedFileType(fileType)) {
      return {
        success: false,
        transactionCount: 0,
        errors: [
          {
            rowNumber: 0,
            errorType: "UNSUPPORTED_FILE_TYPE",
            errorMessage: `File type not supported: ${request.file.name}. Supported formats: PDF, Excel, CSV, ZIP`,
          },
        ],
        message: `Unsupported file type: ${request.file.name}`,
      };
    }

    // 3. Detect encryption
    const encryptionInfo = detectEncryption(buffer, fileType);

    if (encryptionInfo.requiresPassword && !request.password) {
      return {
        success: false,
        transactionCount: 0,
        errors: [],
        message: "PASSWORD_REQUIRED",
      };
    }

    // 4. Parse file (DYNAMIC IMPORTS HERE)
    let parseResult: ParseResult;

    try {
      switch (fileType) {
        case "pdf": {
          const { parsePdf } = await import("./parsePdf");
          parseResult = await parsePdf(
            buffer,
            userId,
            sourceFileId,
            request.password,
          );
          break;
        }

        case "xlsx":
        case "xls": {
          const { parseExcel } = await import("./parseExcel");
          parseResult = await parseExcel(
            buffer,
            fileType,
            userId,
            sourceFileId,
            request.password,
          );
          break;
        }

        case "csv": {
          const { parseCsv } = await import("./parseCsv");
          parseResult = await parseCsv(buffer, userId, sourceFileId);
          break;
        }

        case "zip": {
          const { parseZip } = await import("./parseZip");
          parseResult = await parseZip(
            buffer,
            userId,
            sourceFileId,
            request.password,
          );
          break;
        }

        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (errorMessage === "PASSWORD_REQUIRED") {
        return {
          success: false,
          transactionCount: 0,
          errors: [],
          message: "PASSWORD_REQUIRED",
        };
      }

      return {
        success: false,
        transactionCount: 0,
        errors: [
          {
            rowNumber: 0,
            errorType: "PARSING_ERROR",
            errorMessage: errorMessage,
          },
        ],
        message: `Failed to parse file: ${errorMessage}`,
      };
    }

    // 5. Deduplicate within batch
    const deduplicated = deduplicateTransactions(parseResult.transactions);

    // 6. Validate transactions
    const { valid: validTransactions, errors: validationErrors } =
      validateTransactions(deduplicated);

    // 7. Combine all errors
    const allErrors = [...parseResult.errors, ...validationErrors];

    // 8. Sanitize for AI
    const sanitized = sanitizeTransactions(validTransactions);

    return {
      success: validTransactions.length > 0,
      transactionCount: validTransactions.length,
      errors: allErrors,
      message:
        validTransactions.length > 0
          ? `Successfully ingested ${validTransactions.length} transactions`
          : "No valid transactions found in file",
    };
  } catch (error) {
    return {
      success: false,
      transactionCount: 0,
      errors: [
        {
          rowNumber: 0,
          errorType: "INGESTION_ERROR",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      ],
      message: `Ingestion failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}