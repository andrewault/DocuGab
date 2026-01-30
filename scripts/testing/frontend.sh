#!/bin/bash
# Frontend Testing Script for DocuGab

set -e  # Exit on error

echo "🧪 DocuGab Frontend Testing"
echo "==========================="
echo ""

cd "$(dirname "$0")/../../frontend" || exit 1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
RUN_TESTS=true
RUN_LINT=true
RUN_TYPE_CHECK=true
RUN_BUILD=false
FIX_ISSUES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-tests)
            RUN_TESTS=false
            shift
            ;;
        --no-lint)
            RUN_LINT=false
            shift
            ;;
        --no-type-check)
            RUN_TYPE_CHECK=false
            shift
            ;;
        --build)
            RUN_BUILD=true
            shift
            ;;
        --fix)
            FIX_ISSUES=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--no-tests] [--no-lint] [--no-type-check] [--build] [--fix]"
            exit 1
            ;;
    esac
done

# Function to run command and check result
run_check() {
    local name=$1
    shift
    echo -e "${YELLOW}Running: $name${NC}"
    
    if "$@"; then
        echo -e "${GREEN}✓ $name passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ $name failed${NC}"
        echo ""
        return 1
    fi
}

FAILED=false

# Linting
if [ "$RUN_LINT" = true ]; then
    echo "📋 ESLint Checks"
    echo "----------------"
    
    if [ "$FIX_ISSUES" = true ]; then
        run_check "ESLint (auto-fix)" npm run lint -- --fix || FAILED=true
    else
        run_check "ESLint" npm run lint || FAILED=true
    fi
fi

# Type Checking
if [ "$RUN_TYPE_CHECK" = true ]; then
    echo "🔍 TypeScript Type Checking"
    echo "---------------------------"
    
    run_check "TypeScript" npx tsc --noEmit || FAILED=true
fi

# Tests
if [ "$RUN_TESTS" = true ]; then
    echo "🧪 Running Tests"
    echo "----------------"
    
    if grep -q "\"test\":" package.json; then
        run_check "Vitest" npm test || FAILED=true
    else
        echo -e "${YELLOW}⚠ No test script configured - skipping${NC}"
        echo ""
    fi
fi

# Build Check
if [ "$RUN_BUILD" = true ]; then
    echo "🏗️  Build Check"
    echo "---------------"
    
    run_check "Build" npm run build || FAILED=true
fi

# Summary
echo "==========================="
if [ "$FAILED" = true ]; then
    echo -e "${RED}❌ Some checks failed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
fi
