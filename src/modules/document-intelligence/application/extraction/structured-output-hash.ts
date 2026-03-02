import { createHash } from "node:crypto";

export function hashStructuredOutput(data: Record<string, unknown>): string {
  const normalized = JSON.stringify(sortObject(data));
  return createHash("sha256").update(normalized).digest("hex");
}

function sortObject(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(sortObject);
  }

  if (input && typeof input === "object") {
    const entries = Object.entries(input as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b),
    );
    const output: Record<string, unknown> = {};
    for (const [key, value] of entries) {
      output[key] = sortObject(value);
    }
    return output;
  }

  return input;
}
