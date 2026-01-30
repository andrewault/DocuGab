#!/bin/bash
# Backend Testing Script for DocuGab

set -e  # Exit on error

echo "🧪 DocuGab Backend Testing"
echo "=========================="
echo ""

# Bypass pyenv and let Poetry use its own virtual environment
unset PYENV_VERSION

cd "$(dirname "$0")/../../backend" || exit 1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
RUN_TESTS=false  # Tests optional by default due to Python version issues
RUN_LINT=true
RUN_FORMAT=true
FIX_ISSUES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --with-tests)
            RUN_TESTS=true
            shift
            ;;
        --no-lint)
            RUN_LINT=false
            shift
            ;;
        --no-format)
            RUN_FORMAT=false
            shift
            ;;
        --fix)
            FIX_ISSUES=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--with-tests] [--no-lint] [--no-format] [--fix]"
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
    echo "📋 Code Quality Checks"
    echo "----------------------"
    
    if [ "$FIX_ISSUES" = true ]; then
        run_check "Ruff (auto-fix)" poetry run ruff check --fix || FAILED=true
    else
        run_check "Ruff" poetry run ruff check || FAILED=true
    fi
fi

# Formatting
if [ "$RUN_FORMAT" = true ]; then
    echo "🎨 Code Formatting"
    echo "------------------"
    
    if [ "$FIX_ISSUES" = true ]; then
        run_check "Ruff Format" poetry run ruff format || FAILED=true
    else
        run_check "Ruff Format Check" poetry run ruff format --check || FAILED=true
    fi
fi

# Tests
if [ "$RUN_TESTS" = true ]; then
    echo "🧪 Running Tests"
    echo "----------------"
    
    if [ -d "tests" ] && [ "$(ls -A tests)" ]; then
        # Temporarily disable exit on error for pytest
        set +e
        poetry run pytest -v
        TEST_EXIT_CODE=$?
        set -e
        
        if [ $TEST_EXIT_CODE -eq 0 ]; then
            echo -e "${GREEN}✓ PyTest passed${NC}"
            echo ""
        else
            echo -e "${RED}✗ PyTest failed${NC}"
            echo ""
            FAILED=true
        fi
    else
        echo -e "${YELLOW}⚠ No tests found - skipping${NC}"
        echo ""
    fi
fi

# Summary
echo "=========================="
if [ "$FAILED" = true ]; then
    echo -e "${RED}❌ Some checks failed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
fi
