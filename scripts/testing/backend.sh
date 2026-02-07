#!/bin/bash
# Backend Testing Script for DocuGab

set -e  # Exit on error

echo "🧪 DocuGab Backend Testing"
echo "=========================="
echo ""

# Bypass pyenv and let Poetry use its own virtual environment
unset PYENV_VERSION

# Resolve script directory robustly
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../../backend" || exit 1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
RUN_TESTS=true  # Tests enabled by default
RUN_LINT=true
RUN_FORMAT=true
RUN_SECURITY=true
RUN_COVERAGE=true
FIX_ISSUES=true

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
        --no-format)
            RUN_FORMAT=false
            shift
            ;;
        --no-security)
            RUN_SECURITY=false
            shift
            ;;
        --no-coverage)
            RUN_COVERAGE=false
            shift
            ;;
        --no-fix)
            FIX_ISSUES=false
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--no-tests] [--no-lint] [--no-format] [--no-security] [--no-coverage] [--no-fix]"
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

# Auto-format code first (if --fix is enabled)
if [ "$RUN_FORMAT" = true ] && [ "$FIX_ISSUES" = true ]; then
    echo "🎨 Auto-Formatting Code"
    echo "-----------------------"
    run_check "Ruff Auto-Format" uv run ruff format || FAILED=true
fi

# Formatting Check
if [ "$RUN_FORMAT" = true ]; then
    echo "🎨 Code Formatting Check"
    echo "------------------------"
    
    if [ "$FIX_ISSUES" = true ]; then
        echo -e "${GREEN}✓ Already formatted${NC}"
        echo ""
    else
        run_check "Ruff Format Check" uv run ruff format --check || FAILED=true
    fi
fi

# Security Checks
if [ "$RUN_SECURITY" = true ]; then
    echo "🔒 Security Checks"
    echo "------------------"
    
    # Check if bandit is installed, if not, install it
    if ! uv run python -c "import bandit" 2>/dev/null; then
        echo -e "${YELLOW}Installing bandit...${NC}"
        uv pip install bandit 2>/dev/null || true
    fi
    
    # Run bandit security scanner
    run_check "Bandit Security Scanner" uv run bandit -r app -ll -q || FAILED=true
fi

# Linting (run after formatting)
if [ "$RUN_LINT" = true ]; then
    echo "📋 Code Quality Checks"
    echo "----------------------"
    
    if [ "$FIX_ISSUES" = true ]; then
        echo "🛠️ Applying automatic lint fixes..."
        uv run ruff check --fix || true
        echo ""
    fi

    run_check "Ruff" uv run ruff check || FAILED=true
fi

# Tests
if [ "$RUN_TESTS" = true ]; then
    echo "🧪 Running Tests"
    echo "----------------"

    # Run schema copy from dev to testing
    echo -e "${YELLOW}Syncing test database schema...${NC}"
    SCHEMA_SYNC_FAILED=false
    if "$SCRIPT_DIR/../database/cp-schema-from-dev-to-testing.sh"; then
        echo -e "${GREEN}✓ Schema synced${NC}"
        echo ""
    else
        echo -e "${RED}✗ Schema sync failed${NC}"
        FAILED=true
        SCHEMA_SYNC_FAILED=true
    fi
    
    if [ "$SCHEMA_SYNC_FAILED" = false ] && [ -d "tests" ] && [ "$(ls -A tests)" ]; then
        # Temporarily disable exit on error for pytest
        set +e
        if [ "$RUN_COVERAGE" = true ]; then
            uv run pytest -v --cov=app --cov-report=term-missing --cov-report=html
        else
            uv run pytest -v
        fi
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
        echo -e "${YELLOW}⚠ Skipping tests. Debug info:${NC}"
        echo "FAILED status: $FAILED"
        if [ ! -d "tests" ]; then
            echo "tests directory not found at $(pwd)/tests"
        elif [ -z "$(ls -A tests)" ]; then
            echo "tests directory is empty"
        else
            echo "Unknown reason for skipping tests"
        fi
        echo ""
    fi
fi

# Coverage Report
if [ "$RUN_COVERAGE" = true ] && [ "$RUN_TESTS" = true ]; then
    echo "📊 Coverage Report"
    echo "------------------"
    
    if [ -f ".coverage" ]; then
        echo -e "${GREEN}Coverage report generated${NC}"
        echo "HTML report available at: htmlcov/index.html"
        echo ""
        
        # Show coverage summary
        uv run coverage report --skip-empty || true
        echo ""
    else
        echo -e "${YELLOW}⚠ No coverage data available${NC}"
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
