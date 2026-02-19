#!/bin/bash
# Check for Supabase Type Drift
# This script ensures that TypeScript types are in sync with the Supabase schema

set -e

echo "🔍 Checking for Supabase type drift..."

# Store current types
TYPES_FILE="src/lib/supabase/types.ts"
BACKUP_FILE="src/lib/supabase/types.ts.backup"

if [ ! -f "$TYPES_FILE" ]; then
  echo "❌ Error: $TYPES_FILE not found"
  exit 1
fi

# Backup current types
cp "$TYPES_FILE" "$BACKUP_FILE"

# Generate fresh types from Supabase
echo "📝 Generating fresh types from Supabase schema..."
pnpm supabase gen types typescript --local > "$TYPES_FILE.new" 2>/dev/null || {
  echo "⚠️  Warning: Could not connect to local Supabase. Skipping type drift check."
  echo "   To enable this check, ensure Supabase is running locally with 'pnpm supabase start'"
  rm -f "$BACKUP_FILE"
  exit 0
}

# Compare old and new types
if diff -q "$TYPES_FILE" "$TYPES_FILE.new" > /dev/null 2>&1; then
  echo "✅ Types are in sync with Supabase schema"
  rm -f "$TYPES_FILE.new" "$BACKUP_FILE"
  exit 0
else
  echo "❌ Type drift detected!"
  echo ""
  echo "The TypeScript types are out of sync with the Supabase schema."
  echo "Differences found:"
  echo ""
  diff "$TYPES_FILE" "$TYPES_FILE.new" || true
  echo ""
  echo "To fix this, run:"
  echo "  pnpm supabase gen types typescript --local > $TYPES_FILE"
  echo ""
  
  # Restore backup
  mv "$BACKUP_FILE" "$TYPES_FILE"
  rm -f "$TYPES_FILE.new"
  exit 1
fi
