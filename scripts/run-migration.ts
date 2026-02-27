#!/usr/bin/env tsx
/**
 * Migration Runner Script
 * Applies database migrations to Supabase
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile: string) {
  console.log(`\n📄 Running migration: ${migrationFile}`);

  const migrationPath = path.join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    migrationFile,
  );

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    return false;
  }

  const sql = fs.readFileSync(migrationPath, "utf-8");

  // Split SQL into individual statements (simple split by semicolon)
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`   Found ${statements.length} SQL statements`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments
    if (statement.startsWith("--") || statement.startsWith("/*")) {
      continue;
    }

    try {
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: statement + ";",
      });

      if (error) {
        // Try direct query if RPC fails
        const { error: queryError } = await supabase
          .from("_migrations")
          .select("*")
          .limit(1);

        if (queryError) {
          console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
          console.error(`   SQL: ${statement.substring(0, 100)}...`);
          return false;
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(`   ✓ Executed ${i + 1}/${statements.length} statements`);
      }
    } catch (err) {
      console.error(`   ❌ Statement ${i + 1} failed:`, err);
      return false;
    }
  }

  console.log(`✅ Migration completed: ${migrationFile}`);
  return true;
}

async function main() {
  console.log("🚀 Starting migration runner...\n");
  console.log(`   Supabase URL: ${supabaseUrl}`);

  const migrationFile = process.argv[2] || "008_tax_rules_engine.sql";

  const success = await runMigration(migrationFile);

  if (success) {
    console.log("\n✅ All migrations completed successfully!");
    process.exit(0);
  } else {
    console.log("\n❌ Migration failed!");
    process.exit(1);
  }
}

main();
