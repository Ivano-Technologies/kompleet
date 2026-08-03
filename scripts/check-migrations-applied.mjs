#!/usr/bin/env node
/**
 * Migration-application check — KOMPLEET
 *
 * Compares local files in supabase/migrations/ against remote
 * supabase_migrations.schema_migrations (via `supabase migration list --db-url`).
 * Fails when local and remote diverge in either direction.
 *
 * Env:
 *   DATABASE_URL or SUPABASE_DB_URL — Postgres connection string (required)
 *   SKIP_MIGRATION_CHECK=1          — exit 0 (escape hatch for forks)
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

/** Strip markdown backticks / whitespace from a table cell. */
function stripCell(value) {
  return value.replace(/`/g, "").trim();
}

function parseMigrationList(output) {
  /** @type {{ version: string, local: boolean, remote: boolean }[]} */
  const rows = [];

  // supabase CLI ≥2 emits JSON when not a TTY (CI / pnpm dlx).
  const trimmedAll = output.trim();
  if (trimmedAll.startsWith("{") || trimmedAll.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmedAll);
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.migrations)
          ? parsed.migrations
          : [];
      for (const row of list) {
        const local = typeof row.local === "string" ? row.local : "";
        const remote = typeof row.remote === "string" ? row.remote : "";
        const version = local || remote;
        if (!version || !/^\d+$/.test(version)) continue;
        rows.push({
          version,
          local: Boolean(local),
          remote: Boolean(remote),
        });
      }
      if (rows.length > 0) return rows;
    } catch {
      // fall through to text table parser
    }
  }

  // Current CLI table (supabase@2):
  //   Local            | Remote           | Time (UTC)
  //  ------------------|------------------|-----------------------
  //   `20260219000000` | `20260219000000` | `2026-02-19 00:00:00`
  // Empty local/remote cells mean the version exists only on the other side.
  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^(VERSION|Local\b)/i.test(trimmed)) continue;
    if (/^[-|:\s]+$/.test(trimmed)) continue;

    const parts = trimmed.split("|").map((p) => stripCell(p));
    if (parts.length >= 2) {
      const localVer = /^\d+$/.test(parts[0]) ? parts[0] : "";
      const remoteVer = /^\d+$/.test(parts[1]) ? parts[1] : "";
      const version = localVer || remoteVer;
      if (version) {
        rows.push({
          version,
          local: Boolean(localVer),
          remote: Boolean(remoteVer),
        });
        continue;
      }
    }

    // Older whitespace-separated layouts: VERSION [LOCAL] [REMOTE]
    const ws = trimmed.split(/\s+/).map(stripCell);
    if (ws.length >= 1 && /^\d{10,}$/.test(ws[0])) {
      rows.push({
        version: ws[0],
        local: ws.length === 1 || (ws[1] !== "" && ws[1] !== undefined),
        remote: ws.length >= 3 ? ws[2] !== "" : false,
      });
    }
  }
  return rows;
}

/** supabase CLI requires a percent-encoded --db-url value. */
function percentEncodeDbUrl(connectionString) {
  try {
    const normalized = connectionString.replace(/^postgres(ql)?:/i, "http:");
    const u = new URL(normalized);
    const user = encodeURIComponent(decodeURIComponent(u.username));
    const pass = encodeURIComponent(decodeURIComponent(u.password));
    const auth = pass ? `${user}:${pass}` : user;
    const host = u.host;
    const pathname = u.pathname;
    const search = u.search;
    const scheme = connectionString.startsWith("postgres://")
      ? "postgres"
      : "postgresql";
    return `${scheme}://${auth}@${host}${pathname}${search}`;
  } catch {
    return encodeURI(connectionString);
  }
}

function main() {
  if (process.env.SKIP_MIGRATION_CHECK === "1") {
    console.log(
      "⏭️  SKIP_MIGRATION_CHECK=1 — skipping migration application check.",
    );
    process.exit(0);
  }

  const connectionString =
    process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "";
  if (!connectionString) {
    console.error(
      "❌ Missing DATABASE_URL or SUPABASE_DB_URL.\n" +
        "   Export a Session-pooler Postgres URL so `supabase migration list --db-url` can reach the DB.",
    );
    process.exit(2);
  }

  const local = localMigrationVersions();
  console.log(`Local migration files: ${local.length}`);

  const dbUrl = percentEncodeDbUrl(connectionString);
  const pnpmBin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  let output;
  try {
    output = execFileSync(
      pnpmBin,
      ["dlx", "supabase@2", "migration", "list", "--db-url", dbUrl],
      {
        encoding: "utf8",
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
        shell: process.platform === "win32",
      },
    );
  } catch (err) {
    console.error("❌ `supabase migration list --db-url` failed:");
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
    console.error(
      `  Local-only (never applied remotely) — ${localOnly.length}:`,
    );
    for (const r of localOnly) console.error(`    - ${r.version}`);
  }
  if (remoteOnly.length) {
    console.error(
      `  Remote-only (missing from repo) — ${remoteOnly.length}:`,
    );
    for (const r of remoteOnly) console.error(`    - ${r.version}`);
  }
  console.error("");
  console.error(
    "Fix: apply outstanding local migrations on a Supabase branch, or commit the remote-only SQL.",
  );
  process.exit(1);
}

main();
