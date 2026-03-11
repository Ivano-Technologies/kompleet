import { spawnSync } from "node:child_process";

/** Time-limited exceptions: expired entries become blocking. */
const ALLOWED_GHSA = {
  "GHSA-4r6h-8v6p-xvw6": { package: "xlsx", expires: "2026-06-01" },
  "GHSA-5pgg-2g8v-p4x9": { package: "xlsx", expires: "2026-06-01" },
};

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

const today = new Date();
const advisories = Object.values(report.advisories || {});

const blocking = advisories.filter((advisory) => {
  const severity = String(advisory?.severity || "").toLowerCase();
  if (severity !== "high" && severity !== "critical") {
    return false;
  }
  const ghsaId = advisory?.github_advisory_id || "";
  const allowed = ALLOWED_GHSA[ghsaId];
  if (allowed) {
    const expiresAt = new Date(allowed.expires);
    if (expiresAt < today) {
      return true; // expired exception → blocking
    }
    return false; // allowed and not expired
  }
  // Fail only when no fix is available (patchable vulns are fixed by security-fix.mjs)
  const fixAvailable = advisory?.fixAvailable;
  return fixAvailable !== true;
});

if (blocking.length > 0) {
  console.error("Security audit failed: blocking high/critical advisories (no fix available or exception expired).");
  for (const advisory of blocking) {
    console.error(
      `- ${advisory.github_advisory_id || advisory.id}: ${advisory.module_name} (${advisory.severity})`
    );
  }
  process.exit(1);
}

const ignored = advisories.filter((advisory) => {
  const ghsaId = advisory?.github_advisory_id || "";
  const allowed = ALLOWED_GHSA[ghsaId];
  return allowed && new Date(allowed.expires) >= today;
});

if (ignored.length > 0) {
  console.log("Security audit passed with approved temporary exceptions:");
  for (const advisory of ignored) {
    const allowed = ALLOWED_GHSA[advisory.github_advisory_id] || {};
    console.log(
      `- ${advisory.github_advisory_id}: ${advisory.module_name} (${advisory.severity}) [expires ${allowed.expires}]`
    );
  }
} else {
  console.log("Security audit passed with no blocking high/critical advisories.");
}
