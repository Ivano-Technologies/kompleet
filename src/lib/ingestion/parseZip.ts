/**
 * ZIP parser for bundled bank statements
 * Handles encrypted ZIPs, multiple files, and format detection
 */

import unzipper from 'unzipper';
import { Readable } from 'stream';
import { detectFileType } from './detectFileType';
import { parseCsv } from './parseCsv';
import { parseExcel } from './parseExcel';
import { parsePdf } from './parsePdf';
import { deduplicateTransactions } from './deduplicate';
import { RawRow, ParseResult, ParseError } from './types';
import { normalizeTransactions } from './normalizeTransactions';

/**
 * Parse ZIP file containing multiple statements
 */
export async function parseZip(
  buffer: Buffer,
  userId: string,
  sourceFileId: string,
  password?: string
): Promise<ParseResult> {
  try {
    // 1. Extract ZIP contents
    const entries = await extractZipEntries(buffer, password);

    if (entries.length === 0) {
      throw new Error('ZIP file is empty or could not be extracted');
    }

    // 2. Find statement files
    const statementFiles = entries.filter(entry => {
      const ext = entry.name.toLowerCase().split('.').pop() || '';
      return ['pdf', 'xlsx', 'xls', 'csv'].includes(ext);
    });

    if (statementFiles.length === 0) {
      throw new Error('No statement files found in ZIP');
    }

    // 3. Parse each file
    const allTransactions: any[] = [];
    const allErrors: ParseError[] = [];

    for (const file of statementFiles) {
      try {
        const fileBuffer = file.buffer;
        const fileType = detectFileType(fileBuffer, file.name);

        let result: ParseResult;

        switch (fileType) {
          case 'pdf':
            result = await parsePdf(fileBuffer, userId, sourceFileId, password);
            break;
          case 'xlsx':
            result = await parseExcel(fileBuffer, 'xlsx', userId, sourceFileId, password);
            break;
          case 'xls':
            result = await parseExcel(fileBuffer, 'xls', userId, sourceFileId, password);
            break;
          case 'csv':
            result = await parseCsv(fileBuffer, userId, sourceFileId);
            break;
          default:
            throw new Error(`Unsupported file type: ${fileType}`);
        }

        allTransactions.push(...result.transactions);
        allErrors.push(...result.errors);
      } catch (error) {
        allErrors.push({
          rowNumber: 0,
          errorType: 'FILE_PARSING_ERROR',
          errorMessage: `Failed to parse ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    // 4. Deduplicate across files
    const deduplicated = deduplicateTransactions(allTransactions);

    return {
      transactions: deduplicated,
      errors: allErrors,
      totalRows: allTransactions.length,
      successfulRows: deduplicated.length,
      fileMetadata: {
        fileName: 'unknown.zip',
        fileSize: buffer.length,
        fileType: 'zip',
        isEncrypted: false,
      },
    };
  } catch (error) {
    throw new Error(`ZIP parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract ZIP entries
 */
async function extractZipEntries(
  buffer: Buffer,
  password?: string
): Promise<Array<{ name: string; buffer: Buffer }>> {
  const entries: Array<{ name: string; buffer: Buffer }> = [];

  return new Promise((resolve, reject) => {
    const stream = Readable.from(buffer);

    stream
      .pipe(unzipper.Parse({ password: password || undefined }))
      .on('entry', async entry => {
        try {
          const chunks: Buffer[] = [];

          entry.on('data', chunk => {
            chunks.push(chunk);
          });

          entry.on('end', () => {
            if (entry.type === 'File') {
              entries.push({
                name: entry.path,
                buffer: Buffer.concat(chunks),
              });
            }
          });

          entry.on('error', error => {
            console.warn(`Error reading entry ${entry.path}:`, error);
          });
        } catch (error) {
          console.warn('Error processing entry:', error);
        }
      })
      .on('error', error => {
        if (error instanceof Error && error.message.includes('password')) {
          reject(new Error('PASSWORD_REQUIRED'));
        } else {
          reject(error);
        }
      })
      .on('close', () => {
        resolve(entries);
      });
  });
}
