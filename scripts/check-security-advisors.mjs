#!/usr/bin/env node
/**
 * Supabase security advisor baseline gate — KOMPLEET
 *
 * Fetches security advisors for the project and fails if the count rises above
 * the committed baseline. New tables that forget `revoke all … from anon` will
 * surface here (and as GRANT issues) once advisors catch them.
 *
 * Env:
 *   SUPABASE_ACCESS_TOKEN     — Management API token (required)
 *   SUPABASE_PROJECT_REF      — default frlcvkmjuhnjcicwywrh
 *   SECURITY_ADVISOR_BASELINE — max allowed lint count (default: read from
 *                               scripts/security-advisor-baseline.json)
 *   SKIP_ADVISOR_CHECK=1      — exit 0
 *
 * Exit codes:
 *   0 — lint count <= baseline
 *   1 — lint count above baseline
 *   2 — configuration / API error
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PROJECT_REF =
  process.env.SUPABASE_PROJECT_REF || "frlcvkmjuhnjcicwywrh";
const BASELINE_FILE = path.resolve("scripts/security-advisor-baseline.json");

function loadBaseline() {
  if (process.env.SECURITY_ADVISOR_BASELINE) {
    return Number(process.env.SECURITY_ADVISOR_BASELINE);
  }
  if (!fs.existsSync(BASELINE_FILE)) {
    throw new Error(
      `Missing ${BASELINE_FILE} and SECURITY_ADVISOR_BASELINE is unset`,
    );
  }
  const data = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));
  if (typeof data.securityLintCount !== "number") {
    throw new Error("baseline file missing numeric securityLintCount");
  }
  return data.securityLintCount;
}

async function fetchSecurityAdvisors(token) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/advisors/security`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Advisors API ${res.status}: ${body.slice(0, 400)}`);
  }
  return res.json();
}

async function main() {
  if (process.env.SKIP_ADVISOR_CHECK === "1") {
    console.log("⏭️  SKIP_ADVISOR_CHECK=1 — skipping security advisor gate.");
    process.exit(0);
  }

  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error(
      "❌ Missing SUPABASE_ACCESS_TOKEN.\n" +
        "   Required to call the Supabase Management API advisors endpoint.",
    );
    process.exit(2);
  }

  let baseline;
  try {
    baseline = loadBaseline();
  } catch (err) {
    console.error("❌", err.message);
    process.exit(2);
  }

  let payload;
  try {
    payload = await fetchSecurityAdvisors(token);
  } catch (err) {
    console.error("❌ Failed to fetch security advisors:", err.message);
    process.exit(2);
  }

  const lints = Array.isArray(payload?.lints)
    ? payload.lints
    : Array.isArray(payload)
      ? payload
      : [];
  const count = lints.length;

  console.log(`Security advisor lints: ${count} (baseline ${baseline})`);
  for (const lint of lints) {
    const level = lint.level || lint.severity || "?";
    const name = lint.name || lint.title || "unknown";
    const detail = lint.detail || lint.description || "";
    console.log(`  [${level}] ${name}`);
    if (detail) console.log(`         ${String(detail).slice(0, 160)}`);
  }

  if (count <= baseline) {
    console.log("✅ Security advisor count within baseline.");
    process.exit(0);
  }

  console.error("");
  console.error(
    `❌ Security advisor count rose above baseline (${count} > ${baseline}).`,
  );
  console.error(
    "New tables must revoke anon in the same migration that creates them.",
  );
  console.error(
    "If the increase is intentional, bump scripts/security-advisor-baseline.json in the same PR.",
  );
  process.exit(1);
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(2);
});
