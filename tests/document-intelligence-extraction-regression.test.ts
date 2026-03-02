import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractInvoiceStructuredOutput } from "@/modules/document-intelligence/application/extraction";

interface InvoiceFixture {
  name: string;
  ocrData: Record<string, unknown>;
}

const FIXTURE_DIR = join(process.cwd(), "tests", "fixtures", "invoices");

describe("Document extraction regression corpus", () => {
  it("produces stable structured JSON snapshots for golden invoice corpus", () => {
    const fixtures = loadFixtures();

    for (const fixture of fixtures) {
      const firstPass = extractInvoiceStructuredOutput(fixture.ocrData);
      const secondPass = extractInvoiceStructuredOutput(fixture.ocrData);

      expect(firstPass.structuredData).toEqual(secondPass.structuredData);
      expect(firstPass.structuredData).toMatchSnapshot(`${fixture.name}:structured`);

      const metadata = firstPass.structuredData.__metadata as
        | { structuredHash?: string }
        | undefined;

      expect(firstPass.structuredData.__deterministicHash).toBe(
        metadata?.structuredHash,
      );
      expect(firstPass.structuredData.__deterministicHash).toMatchSnapshot(
        `${fixture.name}:hash`,
      );
    }
  });
});

function loadFixtures(): InvoiceFixture[] {
  const files = readdirSync(FIXTURE_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();

  return files.map((file) => {
    const json = readFileSync(join(FIXTURE_DIR, file), "utf8");
    return JSON.parse(json) as InvoiceFixture;
  });
}
