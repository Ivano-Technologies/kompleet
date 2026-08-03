#!/usr/bin/env node
/**
 * Migration-application check — KOMPLEET
 *
 * Compares local files in supabase/migrations/ against remote
 * supabase_migrations.schema_migrations (via `supabase migration list`).
 * Fails when local and remote diverge in either direction.
 *
 * Env:
 *   SUPABASE_ACCESS_TOKEN  — required for remote list (CI secret)
 *   SUPABASE_PROJECT_REF   — default frlcvkmjuhnjcicwywrh
 *   SKIP_MIGRATION_CHECK=1 — exit 0 (escape hatch for forks without token)
 *
 * Exit codes:
 *   0 — local and remote migration sets match
 *   1 — divergence (local-only, remote-only, or version mismatch)
 *   2 — configuration / CLI error
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PROJECT_REF =
  process.env.SUPABASE_PROJECT_REF || "frlcvkmjuhnjcicwywrh";
const MIGRATIONS_DIR = path.resolve("supabase/migrations");

function localMigrationVersions() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Missing ${MIGRATIONS_DIR}`);
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => {
      const version = f.split("_")[0];
      return { version, file: f };
    })
    .filter((m) => /^\d+$/.test(m.version))
    .sort((a, b) => a.version.localeCompare(b.version));
}

function parseMigrationList(output) {
  /** @type {{ version: string, local: boolean, remote: boolean }[]} */
  const rows = [];
  for (const line of output.split(/\r?\n/)) {
    // supabase CLI table: VERSION | LOCAL | REMOTE  (formats vary by version)
    const trimmed = line.trim();
    if (!trimmed || /^(VERSION|─|Local|Remote)/i.test(trimmed)) continue;
    const parts = trimmed.split("|").map((p) => p.trim());
    if (parts.length >= 3 && /^\d+$/.test(parts[0])) {
      rows.push({
        version: parts[0],
        local: Boolean(parts[1]) && parts[1] !== "",
        remote: Boolean(parts[2]) && parts[2] !== "",
      });
      continue;
    }
    // Fallback: whitespace-separated "version  localMark  remoteMark"
    const ws = trimmed.split(/\s+/);
    if (ws.length >= 1 && /^\d{10,}$/.test(ws[0])) {
      rows.push({
        version: ws[0],
        local: ws.length === 1 || ws[1] !== "",
        remote: ws.length >= 3 ? ws[2] !== "" : false,
      });
    }
  }
  return rows;
}

function main() {
  if (process.env.SKIP_MIGRATION_CHECK === "1") {
    console.log("⏭️  SKIP_MIGRATION_CHECK=1 — skipping migration application check.");
    process.exit(0);
  }

  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    console.error(
      "❌ Missing SUPABASE_ACCESS_TOKEN.\n" +
        "   Set it as a CI secret (or export locally) so `supabase migration list` can reach the project.",
    );
    process.exit(2);
  }

  const local = localMigrationVersions();
  console.log(`Local migration files: ${local.length}`);

  let output;
  try {
    output = execFileSync(
      "pnpm",
      [
        "dlx",
        "supabase@2",
        "migration",
        "list",
        "--project-ref",
        PROJECT_REF,
      ],
      {
        encoding: "utf8",
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } catch (err) {
    console.error("❌ `supabase migration list` failed:");
    console.error(err.stderr || err.message);
    process.exit(2);
  }

  const rows = parseMigrationList(output);
  if (rows.length === 0) {
    console.error("❌ Could not parse `supabase migration list` output:");
    console.error(output);
    process.exit(2);
  }

  const localOnly = rows.filter((r) => r.local && !r.remote);
  const remoteOnly = rows.filter((r) => r.remote && !r.local);
  const matched = rows.filter((r) => r.local && r.remote);

  console.log(`Parsed rows: ${rows.length} (matched ${matched.length})`);

  if (localOnly.length === 0 && remoteOnly.length === 0) {
    console.log("✅ Local and remote migrations are in sync.");
    process.exit(0);
  }

  console.error("");
  console.error("❌ Migration application drift detected:");
  if (localOnly.length) {
    console.error(`  Local-only (never applied remotely) — ${localOnly.length}:`);
    for (const r of localOnly) console.error(`    - ${r.version}`);
  }
  if (remoteOnly.length) {
    console.error(`  Remote-only (missing from repo) — ${remoteOnly.length}:`);
    for (const r of remoteOnly) console.error(`    - ${r.version}`);
  }
  console.error("");
  console.error(
    "Fix: apply outstanding local migrations on a Supabase branch, or commit the remote-only SQL.",
  );
  process.exit(1);
}

main();
