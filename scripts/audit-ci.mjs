import { spawnSync } from "node:child_process";

const ALLOWED_GHSA = new Set([
  "GHSA-4r6h-8v6p-xvw6", // xlsx: no patched npm release
  "GHSA-5pgg-2g8v-p4x9", // xlsx: no patched npm release
]);

const result = spawnSync("pnpm", ["audit", "--prod", "--json"], {
  encoding: "utf8",
  shell: process.platform === "win32",
});

const rawOutput = (result.stdout || "").trim();
if (!rawOutput) {
  console.error("pnpm audit returned no JSON output.");
  process.exit(result.status ?? 1);
}

let report;
try {
  report = JSON.parse(rawOutput);
} catch (error) {
  console.error("Failed to parse pnpm audit JSON output.");
  console.error(error);
  console.error(rawOutput);
  process.exit(1);
}

const advisories = Object.values(report.advisories || {});
const blocking = advisories.filter((advisory) => {
  const severity = String(advisory?.severity || "").toLowerCase();
  if (severity !== "high" && severity !== "critical") {
    return false;
  }
  const ghsaId = advisory?.github_advisory_id || "";
  return !ALLOWED_GHSA.has(ghsaId);
});

if (blocking.length > 0) {
  console.error("Security audit failed: blocking high/critical advisories found.");
  for (const advisory of blocking) {
    console.error(
      `- ${advisory.github_advisory_id || advisory.id}: ${advisory.module_name} (${advisory.severity})`
    );
  }
  process.exit(1);
}

const ignored = advisories.filter((advisory) =>
  ALLOWED_GHSA.has(advisory?.github_advisory_id || "")
);

if (ignored.length > 0) {
  console.log("Security audit passed with approved temporary exceptions:");
  for (const advisory of ignored) {
    console.log(
      `- ${advisory.github_advisory_id}: ${advisory.module_name} (${advisory.severity})`
    );
  }
} else {
  console.log("Security audit passed with no high/critical advisories.");
}
