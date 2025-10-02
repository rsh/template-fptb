#!/bin/bash

# Comprehensive code quality check script
# Runs formatters, linters, type checkers, and tests

set -e  # Exit on error is disabled, we want to run all checks

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
FIX=true
RUN_BACKEND=true
RUN_FRONTEND=true
RUN_TERRAFORM=true

for arg in "$@"; do
    case $arg in
        --nofix)
            FIX=false
            ;;
        backend)
            RUN_FRONTEND=false
            RUN_TERRAFORM=false
            ;;
        frontend)
            RUN_BACKEND=false
            RUN_TERRAFORM=false
            ;;
        terraform)
            RUN_BACKEND=false
            RUN_FRONTEND=false
            ;;
        *)
            echo "Usage: $0 [--nofix] [backend|frontend|terraform]"
            echo "  --nofix     Check formatting without auto-fixing (CI mode)"
            echo "  backend     Run backend checks only"
            echo "  frontend    Run frontend checks only"
            echo "  terraform   Run terraform checks only"
            exit 1
            ;;
    esac
done

# Track results
RESULTS=()
FAILED=0

# Function to run a check
run_check() {
    local name=$1
    local command=$2
    local show_output=${3:-false}

    echo -e "${BLUE}Running $name...${NC}"

    if eval "$command" > /tmp/check_output.log 2>&1; then
        echo -e "${GREEN}✓${NC} $name passed"
        if [ "$show_output" = true ]; then
            cat /tmp/check_output.log
        fi
        RESULTS+=("✓ $name")
        return 0
    else
        echo -e "${RED}✗${NC} $name failed"
        echo "Error output:"
        cat /tmp/check_output.log
        echo ""
        RESULTS+=("✗ $name")
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "================================"
echo "Code Quality Checks"
echo "================================"
echo ""
if [ "$FIX" = true ]; then
    echo -e "${YELLOW}Mode: Auto-fix enabled${NC}"
else
    echo -e "${YELLOW}Mode: Check-only (no auto-fix)${NC}"
fi
echo ""

# Backend checks
if [ "$RUN_BACKEND" = true ]; then
    echo -e "${BLUE}=== Backend Checks ===${NC}"
    echo ""

    cd backend

    # Activate virtual environment
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    else
        echo -e "${RED}Error: Virtual environment not found${NC}"
        echo "Run: cd backend && python -m venv venv && pip install -r requirements-dev.txt"
        exit 1
    fi

    # Black
    if [ "$FIX" = true ]; then
        run_check "Black (formatter)" "black ."
    else
        run_check "Black (formatter)" "black --check ."
    fi

    # isort
    if [ "$FIX" = true ]; then
        run_check "isort (import sorting)" "isort ."
    else
        run_check "isort (import sorting)" "isort --check-only ."
    fi

    # flake8
    run_check "flake8 (linter)" "flake8 ."

    # pylint
    run_check "pylint (code quality)" "pylint *.py"

    # mypy
    run_check "mypy (type checker)" "mypy . --exclude venv"

    # pytest
    run_check "pytest (tests)" "PYTHONPATH=. pytest --cov --cov-report=term-missing -W error" true

    cd ..
    echo ""
fi

# Frontend checks
if [ "$RUN_FRONTEND" = true ]; then
    echo -e "${BLUE}=== Frontend Checks ===${NC}"
    echo ""

    cd frontend

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${RED}Error: node_modules not found${NC}"
        echo "Run: cd frontend && npm install"
        exit 1
    fi

    # Prettier
    if [ "$FIX" = true ]; then
        run_check "Prettier (formatter)" "npm run format"
    else
        run_check "Prettier (formatter)" "npm run format:check"
    fi

    # ESLint
    if [ "$FIX" = true ]; then
        run_check "ESLint (linter)" "npm run lint:fix"
    else
        run_check "ESLint (linter)" "npm run lint"
    fi

    # TypeScript
    run_check "TypeScript (type checker)" "npm run type-check"

    # Jest
    run_check "Jest (tests)" "npm run test:coverage" true

    cd ..
    echo ""
fi

# Terraform checks
if [ "$RUN_TERRAFORM" = true ]; then
    echo -e "${BLUE}=== Terraform Checks ===${NC}"
    echo ""

    cd infrastructure

    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}Error: terraform not found${NC}"
        echo "Install terraform: https://www.terraform.io/downloads.html"
        exit 1
    fi

    # Terraform format
    if [ "$FIX" = true ]; then
        run_check "Terraform fmt (formatter)" "terraform fmt -recursive"
    else
        run_check "Terraform fmt (formatter)" "terraform fmt -check -recursive"
    fi

    # Terraform validate
    run_check "Terraform validate" "terraform init -backend=false && terraform validate"

    cd ..
    echo ""
fi

# Check for increased ignore comments
echo -e "${BLUE}=== Ignore Comments Check ===${NC}"
echo ""

BASELINE_FILE="ignore_baseline.txt"
CURRENT_IGNORES=$(./ignore_finder.sh 2>/dev/null | tail -1 | grep -oE '[0-9]+$' || echo "0")

echo "Current ignore comments: $CURRENT_IGNORES"

if [ -f "$BASELINE_FILE" ]; then
    BASELINE_IGNORES=$(cat "$BASELINE_FILE")
    echo "Baseline ignore comments: $BASELINE_IGNORES"

    if [ "$CURRENT_IGNORES" -gt "$BASELINE_IGNORES" ]; then
        echo -e "${RED}✗${NC} Ignore comments increased from $BASELINE_IGNORES to $CURRENT_IGNORES"
        echo "Run: echo $CURRENT_IGNORES > $BASELINE_FILE  # to update baseline (only if justified)"
        RESULTS+=("✗ Ignore comments (increased)")
        FAILED=$((FAILED + 1))
    elif [ "$CURRENT_IGNORES" -lt "$BASELINE_IGNORES" ]; then
        echo -e "${GREEN}✓${NC} Ignore comments decreased from $BASELINE_IGNORES to $CURRENT_IGNORES"
        echo "Run: echo $CURRENT_IGNORES > $BASELINE_FILE  # to update baseline"
        RESULTS+=("✓ Ignore comments (decreased)")
    else
        echo -e "${GREEN}✓${NC} Ignore comments unchanged"
        RESULTS+=("✓ Ignore comments")
    fi
else
    echo -e "${YELLOW}!${NC} No baseline found, creating baseline with $CURRENT_IGNORES ignores"
    echo "$CURRENT_IGNORES" > "$BASELINE_FILE"
    RESULTS+=("! Ignore comments (baseline created)")
fi

echo ""

# Summary
echo "================================"
echo "Summary"
echo "================================"
echo ""

for result in "${RESULTS[@]}"; do
    if [[ $result == ✓* ]]; then
        echo -e "${GREEN}$result${NC}"
    else
        echo -e "${RED}$result${NC}"
    fi
done

echo ""
echo "================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}$FAILED check(s) failed${NC}"
    exit 1
fi
