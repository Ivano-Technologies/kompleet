#!/bin/bash
set -euo pipefail

# Deploys RLS security policies to Supabase.
#
# Credentials are read from the environment — never hard-code them. This
# repository is PUBLIC and is scanned for secrets in CI.
#
# Usage:
#   export SUPABASE_DB_URL="<pooler connection string from Supabase dashboard>"
#   ./deploy_rls.sh [path/to/migration.sql]

: "${SUPABASE_DB_URL:?Missing SUPABASE_DB_URL. Export the pooler connection string first (see docs/ENVIRONMENT_VARIABLES.md).}"

SQL_FILE="${1:-supabase/migrations/20260205_enable_rls_security_v2.sql}"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "❌ Migration file not found: $SQL_FILE" >&2
  exit 1
fi

echo "🚀 Deploying RLS policies from $SQL_FILE ..."
echo ""

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"

echo ""
echo "✅ Deployment complete."
