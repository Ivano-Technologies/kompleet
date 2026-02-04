#!/usr/bin/env node
/**
 * Apply Database Migration to Supabase
 * Usage: node scripts/apply-migration.js [migration-file]
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🚀 Supabase Migration Runner\n');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration(migrationFile) {
  console.log(`\n📄 Applying migration: ${migrationFile}\n`);
  
  const migrationPath = path.join(__dirname, '..', 'src', 'supabase', 'migrations', migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    return false;
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log(`   Migration file loaded (${sql.length} characters)`);
  console.log(`   \n⚠️  Note: This script will output the SQL for manual execution`);
  console.log(`   Please run this SQL in your Supabase SQL Editor:\n`);
  console.log(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new\n`);
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  
  return true;
}

async function main() {
  const migrationFile = process.argv[2] || '008_tax_rules_engine.sql';
  
  const success = await applyMigration(migrationFile);
  
  if (success) {
    console.log('\n✅ Migration SQL ready for execution');
    console.log('\n📋 Next steps:');
    console.log('   1. Copy the SQL above');
    console.log('   2. Go to Supabase SQL Editor');
    console.log('   3. Paste and run the SQL');
    console.log('   4. Verify tables were created\n');
  } else {
    console.log('\n❌ Failed to load migration');
    process.exit(1);
  }
}

main();
