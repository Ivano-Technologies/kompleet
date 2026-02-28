/**
 * ZIP parser for bundled bank statements
 * Handles encrypted ZIPs, multiple files, and format detection
 */

import { detectFileType } from "./detectFileType";
import { deduplicateTransactions } from "./deduplicate";
import { ParseResult, ParseError } from "./types";

/**
 * Parse ZIP file containing multiple statements
 */
export async function parseZip(
  buffer: Buffer,
  userId: string,
  sourceFileId: string,
  password?: string,
): Promise<ParseResult> {
  try {
    const entries = await extractZipEntries(buffer, password);

    if (entries.length === 0) {
      throw new Error("ZIP file is empty or could not be extracted");
    }

    const statementFiles = entries.filter((entry) => {
      const ext = entry.name.toLowerCase().split(".").pop() || "";
      return ["pdf", "xlsx", "xls", "csv"].includes(ext);
    });

    if (statementFiles.length === 0) {
      throw new Error("No statement files found in ZIP");
    }

    const allTransactions: any[] = [];
    const allErrors: ParseError[] = [];

    for (const file of statementFiles) {
      try {
        const fileBuffer = file.buffer;
        const fileType = detectFileType(fileBuffer, file.name);

        let result: ParseResult;

        switch (fileType) {
          case "pdf": {
            const { parsePdf } = await import("./parsePdf");
            result = await parsePdf(
              fileBuffer,
              userId,
              sourceFileId,
              password,
            );
            break;
          }

          case "xlsx": {
            const { parseExcel } = await import("./parseExcel");
            result = await parseExcel(
              fileBuffer,
              "xlsx",
              userId,
              sourceFileId,
              password,
            );
            break;
          }

          case "xls": {
            const { parseExcel } = await import("./parseExcel");
            result = await parseExcel(
              fileBuffer,
              "xls",
              userId,
              sourceFileId,
              password,
            );
            break;
          }

          case "csv": {
            const { parseCsv } = await import("./parseCsv");
            result = await parseCsv(
              fileBuffer,
              userId,
              sourceFileId,
            );
            break;
          }

          default:
            throw new Error(`Unsupported file type: ${fileType}`);
        }

        allTransactions.push(...result.transactions);
        allErrors.push(...result.errors);
      } catch (error) {
        allErrors.push({
          rowNumber: 0,
          errorType: "FILE_PARSING_ERROR",
          errorMessage: `Failed to parse ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    }

    const deduplicated = deduplicateTransactions(allTransactions);

    return {
      transactions: deduplicated,
      errors: allErrors,
      totalRows: allTransactions.length,
      successfulRows: deduplicated.length,
      fileMetadata: {
        fileName: "unknown.zip",
        fileSize: buffer.length,
        fileType: "zip",
        isEncrypted: false,
      },
    };
  } catch (error) {
    throw new Error(
      `ZIP parsing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Extract ZIP entries (dynamic unzipper import)
 */
async function extractZipEntries(
  buffer: Buffer,
  password?: string,
): Promise<Array<{ name: string; buffer: Buffer }>> {
  const entries: Array<{ name: string; buffer: Buffer }> = [];

  const unzipperModule = await import("unzipper");
  const streamModule = await import("stream");

  const unzipper =
    (unzipperModule as any).default ?? unzipperModule;
  const { Readable } = streamModule as any;

  return new Promise((resolve, reject) => {
    const stream = Readable.from(buffer);

    stream
      .pipe(unzipper.Parse())
      .on("entry", async (entry: any) => {
        try {
          const chunks: Buffer[] = [];

          entry.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
          });

          entry.on("end", () => {
            if (entry.type === "File") {
              entries.push({
                name: entry.path,
                buffer: Buffer.concat(chunks),
              });
            }
          });

          entry.on("error", () => {});
        } catch {}
      })
      .on("error", (error: any) => {
        if (
          error instanceof Error &&
          error.message.includes("password")
        ) {
          reject(new Error("PASSWORD_REQUIRED"));
        } else {
          reject(error);
        }
      })
      .on("close", () => {
        resolve(entries);
      });
  });
}