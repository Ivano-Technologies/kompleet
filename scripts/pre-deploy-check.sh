#!/bin/bash

# KOMPLEET Pre-Deployment Verification Script
# Run this before deploying to production

set -e

echo "🚀 KOMPLEET Pre-Deployment Checks"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Helper function to print check results
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "📋 Phase 1: Code Quality Checks"
echo "--------------------------------"

# Check 1: TypeScript compilation
echo -n "Checking TypeScript compilation... "
if pnpm typecheck > /dev/null 2>&1; then
    check_pass "TypeScript compilation clean"
else
    check_fail "TypeScript errors found"
fi

# Check 2: ESLint
echo -n "Running ESLint... "
if pnpm lint > /dev/null 2>&1; then
    check_pass "No linting errors"
else
    check_fail "Linting errors found"
fi

# Check 3: Build
echo -n "Running production build... "
if pnpm build > /dev/null 2>&1; then
    check_pass "Build successful"
else
    check_fail "Build failed"
fi

# Check 4: Tests
echo -n "Running tests... "
if pnpm test > /dev/null 2>&1; then
    TEST_COUNT=$(pnpm test 2>&1 | grep -oP '\d+ passed' | head -1 | grep -oP '\d+')
    check_pass "Tests passed ($TEST_COUNT tests)"
else
    check_fail "Tests failed"
fi

echo ""
echo "🔐 Phase 2: Security Checks"
echo "----------------------------"

# Check 5: No service_role key in frontend
echo -n "Checking for exposed secrets... "
if grep -r "service_role" src/app src/components > /dev/null 2>&1; then
    check_fail "Found service_role key in frontend code!"
else
    check_pass "No service_role key in frontend"
fi

# Check 6: Environment variables template exists
echo -n "Checking .env.example... "
if [ -f ".env.example" ]; then
    check_pass ".env.example exists"
else
    check_warn ".env.example not found"
fi

# Check 7: Git status
echo -n "Checking git status... "
if [ -z "$(git status --porcelain)" ]; then
    check_pass "Working directory clean"
else
    check_warn "Uncommitted changes found"
fi

echo ""
echo "📊 Phase 3: Feature Completeness"
echo "----------------------------------"

# Check 8: API routes exist
echo -n "Checking API routes... "
REQUIRED_ROUTES=(
    "src/app/api/calculations/save/route.ts"
    "src/app/api/calculations/route.ts"
    "src/app/api/calculations/[id]/route.ts"
)
MISSING_ROUTES=0
for route in "${REQUIRED_ROUTES[@]}"; do
    if [ ! -f "$route" ]; then
        ((MISSING_ROUTES++))
    fi
done
if [ $MISSING_ROUTES -eq 0 ]; then
    check_pass "All required API routes exist"
else
    check_fail "$MISSING_ROUTES API routes missing"
fi

# Check 9: Calculator pages exist
echo -n "Checking calculator pages... "
CALCULATOR_PAGES=(
    "src/app/(dashboard)/calculators/business-tax/page.tsx"
    "src/app/(dashboard)/calculators/individual-tax/page.tsx"
    "src/app/(dashboard)/calculators/vat/page.tsx"
)
MISSING_PAGES=0
for page in "${CALCULATOR_PAGES[@]}"; do
    if [ ! -f "$page" ]; then
        ((MISSING_PAGES++))
    fi
done
if [ $MISSING_PAGES -eq 0 ]; then
    check_pass "All calculator pages exist"
else
    check_fail "$MISSING_PAGES calculator pages missing"
fi

# Check 10: History page exists
echo -n "Checking history page... "
if [ -f "src/app/(dashboard)/calculators/history/page.tsx" ]; then
    check_pass "History page exists"
else
    check_fail "History page missing"
fi

# Check 11: Tax Center page exists
echo -n "Checking Tax Center page... "
if [ -f "src/app/(dashboard)/calculators/page.tsx" ]; then
    check_pass "Tax Center page exists"
else
    check_fail "Tax Center page missing"
fi

echo ""
echo "📚 Phase 4: Documentation"
echo "--------------------------"

# Check 12: Deployment guide exists
echo -n "Checking deployment guide... "
if [ -f "docs/DEPLOYMENT_GUIDE.md" ]; then
    check_pass "Deployment guide exists"
else
    check_warn "Deployment guide missing"
fi

# Check 13: Database schema docs exist
echo -n "Checking database documentation... "
if [ -f "docs/DATABASE_SCHEMA_TAX_CALCULATIONS.md" ]; then
    check_pass "Database schema documented"
else
    check_warn "Database schema docs missing"
fi

# Check 14: API documentation exists
echo -n "Checking API documentation... "
if [ -f "docs/API_CALCULATIONS.md" ]; then
    check_pass "API documentation exists"
else
    check_warn "API documentation missing"
fi

echo ""
echo "🔧 Phase 5: Configuration"
echo "-------------------------"

# Check 15: vercel.json exists
echo -n "Checking Vercel configuration... "
if [ -f "vercel.json" ]; then
    check_pass "vercel.json exists"
else
    check_warn "vercel.json missing"
fi

# Check 16: Middleware exists
echo -n "Checking authentication middleware... "
if [ -f "middleware.ts" ]; then
    check_pass "Middleware configured"
else
    check_fail "Middleware missing"
fi

# Check 17: Rate limiting configured
echo -n "Checking rate limiting... "
if grep -r "withRateLimit" src/app/api > /dev/null 2>&1; then
    RATE_LIMITED=$(grep -r "withRateLimit" src/app/api | wc -l)
    check_pass "Rate limiting configured ($RATE_LIMITED routes)"
else
    check_fail "No rate limiting found"
fi

# Check 18: RBAC configured
echo -n "Checking RBAC... "
if grep -r "withAuth" src/app/api > /dev/null 2>&1; then
    RBAC_ROUTES=$(grep -r "withAuth" src/app/api | wc -l)
    check_pass "RBAC configured ($RBAC_ROUTES routes)"
else
    check_warn "No RBAC found"
fi

echo ""
echo "=================================="
echo "📊 Final Results"
echo "=================================="
echo -e "${GREEN}Passed:${NC} $PASSED checks"
echo -e "${RED}Failed:${NC} $FAILED checks"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review docs/DEPLOYMENT_GUIDE.md"
    echo "2. Configure environment variables in Vercel"
    echo "3. Enable PITR in Supabase (see docs/DATABASE_PITR_GUIDE.md)"
    echo "4. Deploy to Vercel"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please fix issues before deploying.${NC}"
    echo ""
    exit 1
fi
