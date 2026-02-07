import { readFileSync } from 'fs';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

async function migrate() {
  console.log('🔄 Connecting to database...');
  
  // TypeScript knows DATABASE_URL is defined here because of the check above
  const sql = postgres(DATABASE_URL!, {
    ssl: 'require',
  });

  try {
    console.log('✅ Connected to database');
    console.log('📝 Reading migration file...');
    
    const migrationSQL = readFileSync('./src/supabase/migrations/003_core_tables.sql', 'utf-8');
    
    console.log('🚀 Executing migration...');
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('\n📊 Tables in database:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
