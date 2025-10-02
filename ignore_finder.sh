#!/bin/bash

# Script to find all linting, type checking, and formatting ignore comments

echo "Finding all ignore comments in the codebase..."
echo ""
echo "Format: <file>:<line_number>: <code>"
echo "================================================"
echo ""

# Define patterns to search for
PATTERNS=(
    # Python linting/type checking
    "# pylint:"
    "# type: ignore"
    "# type:ignore"  # without space
    "# noqa:"
    "# noqa"  # without colon (ignore all)
    "# mypy:"
    "# flake8:"
    "# isort:"
    "# yapf:"
    "# fmt:"
    "# pragma: no cover"
    "# pragma:no cover"  # without space
    "# pyright:"
    "# pyre-ignore"
    "# bandit:"
    "# coverage:"

    # JavaScript/TypeScript linting
    "eslint-disable"
    "@ts-ignore"
    "@ts-expect-error"
    "@ts-nocheck"
    "prettier-ignore"
    "tslint:"

    # Terraform security scanning (if needed)
    "tfsec:ignore"
    "checkov:skip"
)

# Combine patterns into a single grep regex
PATTERN_REGEX=$(IFS='|'; echo "${PATTERNS[*]}")

# Search in backend and frontend, excluding common directories
grep -rn \
    --include="*.py" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=venv \
    --exclude-dir=.venv \
    --exclude-dir=dist \
    --exclude-dir=build \
    --exclude-dir=__pycache__ \
    --exclude-dir=.git \
    --exclude-dir=coverage \
    --exclude-dir=htmlcov \
    --exclude-dir=.pytest_cache \
    -E "$PATTERN_REGEX" \
    backend/ frontend/ 2>/dev/null | sort

# Count total
TOTAL=$(grep -r \
    --include="*.py" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=venv \
    --exclude-dir=.venv \
    --exclude-dir=dist \
    --exclude-dir=build \
    --exclude-dir=__pycache__ \
    --exclude-dir=.git \
    --exclude-dir=coverage \
    --exclude-dir=htmlcov \
    --exclude-dir=.pytest_cache \
    -E "$PATTERN_REGEX" \
    backend/ frontend/ 2>/dev/null | wc -l)

echo ""
echo "================================================"
echo "Total ignore comments found: $TOTAL"
