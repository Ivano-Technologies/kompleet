#!/usr/bin/env node
/**
 * Schema drift detector — KOMPLEET
 *
 * Greps every `.from("…")` / `.from('…')` call in `src/`, queries
 * information_schema.tables on the target database, and exits non-zero if any
 * referenced table does not exist.
 *
 * Env:
 *   DATABASE_URL or SUPABASE_DB_URL  — Postgres connection string (required)
 *   SCHEMA_DRIFT_SCHEMAS             — comma list, default "public"
 *   SCHEMA_DRIFT_IGNORE              — comma list of table names to skip
 *                                      (e.g. "users" when code means auth.users)
 *
 * Exit codes:
 *   0 — every referenced table exists
 *   1 — one or more referenced tables are missing
 *   2 — configuration / connection error
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const FROM_RE = /\.from\(\s*['"]([a-zA-Z_][a-zA-Z0-9_]*)['"]\s*\)/g;
const SRC_ROOT = path.resolve("src");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".next") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function collectReferences() {
  /** @type {Map<string, Set<string>>} */
  const tables = new Map();
  for (const file of walk(SRC_ROOT)) {
    const text = fs.readFileSync(file, "utf8");
    let m;
    FROM_RE.lastIndex = 0;
    while ((m = FROM_RE.exec(text))) {
      const name = m[1];
      if (!tables.has(name)) tables.set(name, new Set());
      tables.get(name).add(path.relative(process.cwd(), file).replace(/\\/g, "/"));
    }
  }
  return tables;
}

function parseList(value) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function loadExistingTables(client, schemas) {
  const { rows } = await client.query(
    `select table_schema, table_name
       from information_schema.tables
      where table_type = 'BASE TABLE'
        and table_schema = any($1::text[])`,
    [schemas],
  );
  return new Set(rows.map((r) => r.table_name));
}

async function main() {
  const connectionString =
    process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "";
  if (!connectionString) {
    console.error(
      "❌ Missing DATABASE_URL or SUPABASE_DB_URL.\n" +
        "   Export a Postgres connection string (pooler or direct) before running.",
    );
    process.exit(2);
  }

  const schemas = parseList(process.env.SCHEMA_DRIFT_SCHEMAS);
  const schemaList = schemas.length > 0 ? schemas : ["public"];
  const ignore = new Set(parseList(process.env.SCHEMA_DRIFT_IGNORE));

  const references = collectReferences();
  const referenced = [...references.keys()].sort();

  // Supabase pooler presents a cert chain that Node's default TLS rejects on
  // some environments. Strip sslmode from the URL and set ssl explicitly so
  // we never log credentials.
  const isLocal =
    /localhost|127\.0\.0\.1/.test(connectionString) ||
    process.env.SCHEMA_DRIFT_SSL === "disable";

  let clientConfig;
  if (isLocal) {
    clientConfig = { connectionString, ssl: false };
  } else {
    const cleaned = connectionString
      .replace(/([?&])sslmode=[^&]*/gi, "$1")
      .replace(/[?&]$/, "")
      .replace(/\?&/, "?");
    clientConfig = {
      connectionString: cleaned,
      ssl: { rejectUnauthorized: false },
    };
  }
  const client = new pg.Client(clientConfig);

  try {
    await client.connect();
  } catch (err) {
    console.error("❌ Failed to connect to database:", err.message);
    process.exit(2);
  }

  let existing;
  try {
    existing = await loadExistingTables(client, schemaList);
  } catch (err) {
    console.error("❌ Failed to query information_schema:", err.message);
    await client.end().catch(() => {});
    process.exit(2);
  } finally {
    await client.end().catch(() => {});
  }

  const missing = referenced.filter(
    (name) => !ignore.has(name) && !existing.has(name),
  );

  console.log(`Referenced tables in src/: ${referenced.length}`);
  console.log(`Existing in [${schemaList.join(", ")}]: ${existing.size}`);
  console.log(`Ignored: ${ignore.size ? [...ignore].join(", ") : "(none)"}`);

  if (missing.length === 0) {
    console.log("✅ No schema drift — every .from() target exists.");
    process.exit(0);
  }

  console.error("");
  console.error(
    `❌ Schema drift: ${missing.length} table(s) referenced in code but missing from the database:`,
  );
  for (const name of missing) {
    const files = [...references.get(name)].sort();
    console.error(`  - ${name}  (${files.length} file${files.length === 1 ? "" : "s"})`);
    for (const f of files.slice(0, 8)) console.error(`      ${f}`);
    if (files.length > 8) console.error(`      … +${files.length - 8} more`);
  }
  console.error("");
  console.error(
    "Fix: add a migration for each missing table, or delete the dead .from() call sites.",
  );
  process.exit(1);
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(2);
});
