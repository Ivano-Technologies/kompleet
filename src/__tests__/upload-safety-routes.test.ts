import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("upload safety wiring", () => {
  it("sniffs library metadata on Convex save and deletes rejected blobs", () => {
    const files = read("convex/files.ts");
    expect(files).toMatch(/inspectUpload/);
    expect(files).toMatch(/ctx\.storage\.delete/);
    expect(files).toMatch(/kind: "library"/);
  });

  it("sniffs receipts, avatars, statements and OCR before persist", () => {
    expect(read("src/app/api/expenses/receipt/route.ts")).toMatch(/inspectUpload/);
    expect(read("src/app/api/upload-avatar/route.ts")).toMatch(/inspectUpload/);
    expect(read("src/app/api/transactions/upload-v2/route.ts")).toMatch(
      /kind: "statement"/,
    );
    expect(read("src/app/api/transactions/upload/route.ts")).toMatch(
      /kind: "statement"/,
    );
    expect(read("src/app/api/ingest/route.ts")).toMatch(/kind: "ingest"/);
    expect(read("src/app/api/expenses/ocr/route.ts")).toMatch(/OCR_MAX_BYTES/);
    expect(read("convex/users.ts")).toMatch(/setMyAvatar/);
    expect(read("convex/users.ts")).toMatch(/kind: "image"/);
  });
});
