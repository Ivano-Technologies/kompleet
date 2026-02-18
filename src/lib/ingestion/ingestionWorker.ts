/**
 * Ingestion worker - orchestrates the entire ingestion pipeline
 * Handles file detection, encryption, parsing, normalization, validation
 */

import { detectFileType, isSupportedFileType } from './detectFileType';
import { detectEncryption } from './detectEncryption';
import { parsePdf } from './parsePdf';
import { parseExcel } from './parseExcel';
import { parseCsv } from './parseCsv';
import { parseZip } from './parseZip';
import { deduplicateTransactions } from './deduplicate';
import { sanitizeTransactions } from './sanitizeForAI';
import { validateTransactions } from './validate';
import { IngestionRequest, IngestionResponse, ParseResult } from './types';

/**
 * Main ingestion function
 * Orchestrates: file detection → encryption → parsing → normalization → validation → sanitization
 */
export async function ingestStatement(
  request: IngestionRequest,
  userId: string,
  sourceFileId: string
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
            errorType: 'UNSUPPORTED_FILE_TYPE',
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
        message: 'PASSWORD_REQUIRED',
      };
    }

    // 4. Parse file
    let parseResult: ParseResult;

    try {
      switch (fileType) {
        case 'pdf':
          parseResult = await parsePdf(buffer, userId, sourceFileId, request.password);
          break;
        case 'xlsx':
          parseResult = await parseExcel(buffer, 'xlsx', userId, sourceFileId, request.password);
          break;
        case 'xls':
          parseResult = await parseExcel(buffer, 'xls', userId, sourceFileId, request.password);
          break;
        case 'csv':
          parseResult = await parseCsv(buffer, userId, sourceFileId);
          break;
        case 'zip':
          parseResult = await parseZip(buffer, userId, sourceFileId, request.password);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'PASSWORD_REQUIRED') {
        return {
          success: false,
          transactionCount: 0,
          errors: [],
          message: 'PASSWORD_REQUIRED',
        };
      }

      return {
        success: false,
        transactionCount: 0,
        errors: [
          {
            rowNumber: 0,
            errorType: 'PARSING_ERROR',
            errorMessage: errorMessage,
          },
        ],
        message: `Failed to parse file: ${errorMessage}`,
      };
    }

    // 5. Deduplicate within batch
    const deduplicated = deduplicateTransactions(parseResult.transactions);

    // 6. Validate transactions
    const { valid: validTransactions, errors: validationErrors } = validateTransactions(deduplicated);

    // 7. Combine all errors
    const allErrors = [...parseResult.errors, ...validationErrors];

    // 8. Sanitize for AI (remove sensitive data)
    const sanitized = sanitizeTransactions(validTransactions);

    return {
      success: validTransactions.length > 0,
      transactionCount: validTransactions.length,
      errors: allErrors,
      message:
        validTransactions.length > 0
          ? `Successfully ingested ${validTransactions.length} transactions`
          : 'No valid transactions found in file',
    };
  } catch (error) {
    return {
      success: false,
      transactionCount: 0,
      errors: [
        {
          rowNumber: 0,
          errorType: 'INGESTION_ERROR',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      message: `Ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Convert File to Buffer
 */
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Get ingestion status
 */
export function getIngestionStatus(response: IngestionResponse): {
  status: 'success' | 'error' | 'partial';
  message: string;
  transactionCount: number;
  errorCount: number;
} {
  if (response.success && response.errors.length === 0) {
    return {
      status: 'success',
      message: response.message || 'Ingestion completed successfully',
      transactionCount: response.transactionCount,
      errorCount: 0,
    };
  }

  if (!response.success && response.transactionCount === 0) {
    return {
      status: 'error',
      message: response.message || 'Ingestion failed',
      transactionCount: 0,
      errorCount: response.errors.length,
    };
  }

  return {
    status: 'partial',
    message: `Ingestion completed with errors: ${response.transactionCount} transactions, ${response.errors.length} errors`,
    transactionCount: response.transactionCount,
    errorCount: response.errors.length,
  };
}
