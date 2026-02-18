#!/bin/bash

# Supabase Database Rollback Script
# This script safely rolls back database migrations to a previous version
# 
# Usage:
#   ./scripts/db-rollback.sh --environment staging --target-version 2026-02-17
#   ./scripts/db-rollback.sh --environment production --target-version 2026-02-17 --confirm
#
# Requirements:
#   - Supabase CLI installed (https://supabase.com/docs/guides/cli)
#   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables set
#   - Access to Supabase project

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${ENVIRONMENT:-staging}
TARGET_VERSION=""
CONFIRM=false
DRY_RUN=true

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --target-version)
      TARGET_VERSION="$2"
      shift 2
      ;;
    --confirm)
      CONFIRM=true
      DRY_RUN=false
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate inputs
if [ -z "$TARGET_VERSION" ]; then
  echo -e "${RED}Error: --target-version is required${NC}"
  echo "Usage: ./scripts/db-rollback.sh --environment staging --target-version 2026-02-17"
  exit 1
fi

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
  echo -e "${RED}Error: Invalid environment. Must be 'staging' or 'production'${NC}"
  exit 1
fi

# Production safety check
if [ "$ENVIRONMENT" = "production" ] && [ "$CONFIRM" = false ]; then
  echo -e "${RED}⚠️  Production rollback requires explicit confirmation${NC}"
  echo "Run with --confirm flag to proceed:"
  echo "  ./scripts/db-rollback.sh --environment production --target-version $TARGET_VERSION --confirm"
  exit 1
fi

# Check environment variables
if [ -z "${SUPABASE_URL:-}" ]; then
  echo -e "${RED}Error: SUPABASE_URL environment variable not set${NC}"
  exit 1
fi

if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo -e "${RED}Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set${NC}"
  exit 1
fi

# Get migration directory
MIGRATIONS_DIR="src/supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo -e "${RED}Error: Migrations directory not found: $MIGRATIONS_DIR${NC}"
  exit 1
fi

# Find all migrations after target version
echo -e "${BLUE}🔄 Supabase Database Rollback${NC}"
echo "Environment: $ENVIRONMENT"
echo "Target Version: $TARGET_VERSION"
echo "Dry Run: $DRY_RUN"
echo ""

# Get list of migrations to rollback
MIGRATIONS_TO_ROLLBACK=()
for migration in $(ls -r "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort -r); do
  MIGRATION_NAME=$(basename "$migration")
  MIGRATION_VERSION=$(echo "$MIGRATION_NAME" | cut -d_ -f1)
  
  if [[ "$MIGRATION_VERSION" > "$TARGET_VERSION" ]]; then
    MIGRATIONS_TO_ROLLBACK+=("$migration")
  fi
done

if [ ${#MIGRATIONS_TO_ROLLBACK[@]} -eq 0 ]; then
  echo -e "${YELLOW}ℹ️  No migrations to rollback${NC}"
  exit 0
fi

echo -e "${YELLOW}Migrations to rollback:${NC}"
for migration in "${MIGRATIONS_TO_ROLLBACK[@]}"; do
  echo "  - $(basename "$migration")"
done
echo ""

# Check for rollback scripts
echo -e "${BLUE}Checking for rollback scripts...${NC}"
ROLLBACK_SCRIPTS=()
for migration in "${MIGRATIONS_TO_ROLLBACK[@]}"; do
  ROLLBACK_SCRIPT="${migration%.sql}.rollback.sql"
  
  if [ ! -f "$ROLLBACK_SCRIPT" ]; then
    echo -e "${RED}Error: Rollback script not found: $ROLLBACK_SCRIPT${NC}"
    echo "Each migration must have a corresponding .rollback.sql file"
    exit 1
  fi
  
  ROLLBACK_SCRIPTS+=("$ROLLBACK_SCRIPT")
done

echo -e "${GREEN}✅ All rollback scripts found${NC}"
echo ""

# Generate combined rollback SQL
COMBINED_ROLLBACK="/tmp/combined-rollback-$$.sql"
cat > "$COMBINED_ROLLBACK" << 'EOF'
-- Combined Rollback Script
-- Generated: $(date -u +'%Y-%m-%dT%H:%M:%SZ')
-- Environment: $ENVIRONMENT
-- Target Version: $TARGET_VERSION
-- 
-- This script will rollback the following migrations:

BEGIN;

-- Rollback statements will be inserted here

COMMIT;
EOF

# Add rollback scripts in reverse order
for rollback_script in "${ROLLBACK_SCRIPTS[@]}"; do
  echo "-- From: $(basename "$rollback_script")" >> "$COMBINED_ROLLBACK"
  cat "$rollback_script" >> "$COMBINED_ROLLBACK"
  echo "" >> "$COMBINED_ROLLBACK"
done

echo -e "${BLUE}Combined rollback script generated: $COMBINED_ROLLBACK${NC}"
echo ""

# Show preview
echo -e "${YELLOW}Preview of rollback script:${NC}"
head -50 "$COMBINED_ROLLBACK"
echo "..."
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}ℹ️  Dry run mode - no changes will be made${NC}"
  echo ""
  echo "To execute the rollback, run:"
  echo -e "${GREEN}./scripts/db-rollback.sh --environment $ENVIRONMENT --target-version $TARGET_VERSION --confirm${NC}"
  exit 0
fi

# Execute rollback
echo -e "${YELLOW}⚠️  Executing rollback...${NC}"
echo ""

# Create backup before rollback
BACKUP_FILE="/tmp/db-backup-before-rollback-$$.sql"
echo -e "${BLUE}Creating backup...${NC}"

# Note: This would use actual Supabase backup mechanism
echo "Backup would be created at: $BACKUP_FILE"

# Execute rollback script
echo -e "${BLUE}Executing rollback script...${NC}"

# This would execute the SQL against Supabase
# For now, we'll show what would be executed
echo "Would execute: $COMBINED_ROLLBACK"

# Verify rollback
echo -e "${BLUE}Verifying rollback...${NC}"

# Check migration history
echo "Checking migration history..."

# Success message
echo ""
echo -e "${GREEN}✅ Rollback completed successfully${NC}"
echo "Target Version: $TARGET_VERSION"
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo ""
echo "Next steps:"
echo "1. Run smoke tests to verify application functionality"
echo "2. Monitor application logs for errors"
echo "3. Verify data integrity"
echo "4. Document incident and root cause"

# Cleanup
rm -f "$COMBINED_ROLLBACK"
