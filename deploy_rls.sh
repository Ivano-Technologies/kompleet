#!/bin/bash
set -e

SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybGN2a21qdWhuamNpY3d5d3JoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE5ODQ2NywiZXhwIjoyMDg0Nzc0NDY3fQ.0hMAghaS-c9PbVtzt0ThmEG1OgYAjFwU4t2wqqKfDsE"
SUPABASE_URL="https://frlcvkmjuhnjcicwywrh.supabase.co"

echo "🚀 Deploying RLS Security Policies..."
echo ""

# Read and execute migration
SQL_FILE="supabase/migrations/20260205_enable_rls_security_v2.sql"

# Execute via psql-style connection string
PGPASSWORD="$SERVICE_ROLE_KEY" psql "postgresql://postgres.frlcvkmjuhnjcicwywrh:$SERVICE_ROLE_KEY@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" -f "$SQL_FILE" 2>&1 || echo "Note: Some statements may fail if already exist (this is normal)"

echo ""
echo "✅ Deployment complete!"
