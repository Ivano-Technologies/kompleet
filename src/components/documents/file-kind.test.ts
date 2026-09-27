import { describe, expect, it } from "vitest";
import {
  classifyFileKind,
  isAllowedDocsFile,
  looksLikeBankStatement,
  rejectDocsFile,
} from "./file-kind";
import { DOCS_COPY } from "./docs-copy";

function fakeFile(name: string, type = "", size = 1024): File {
  return new File(["x"], name, { type, lastModified: 0 });
}

describe("docs file kind", () => {
  it("classifies pdf, image, and spreadsheet extensions", () => {
    expect(classifyFileKind("receipt.pdf")).toBe("pdf");
    expect(classifyFileKind("scan.JPG")).toBe("image");
    expect(classifyFileKind("export.csv")).toBe("csv");
    expect(classifyFileKind("ledger.xlsx")).toBe("csv");
    expect(classifyFileKind("notes.txt")).toBe("other");
  });

  it("accepts the Wave 4 set and rejects others", () => {
    expect(isAllowedDocsFile(fakeFile("a.pdf"))).toBe(true);
    expect(isAllowedDocsFile(fakeFile("a.webp"))).toBe(true);
    expect(isAllowedDocsFile(fakeFile("a.xls"))).toBe(true);
    expect(rejectDocsFile(fakeFile("a.docx"))).toBe(DOCS_COPY.toastReject);
  });

  it("nudges statement-like names only for statement extensions", () => {
    expect(looksLikeBankStatement("GTB_September_statement.pdf")).toBe(true);
    expect(looksLikeBankStatement("access-bank.csv")).toBe(true);
    expect(looksLikeBankStatement("invoice-scan.jpg")).toBe(false);
    expect(looksLikeBankStatement("clients.csv")).toBe(false);
    expect(
      looksLikeBankStatement("gtb-export", { contentType: "text/csv" }),
    ).toBe(true);
  });
});
