# Testing Scripts

Automated testing and quality check scripts for the DocuGab project.

## Overview

This directory contains shell scripts to run comprehensive quality checks on both backend and frontend code.

## Scripts

### `backend.sh`

Runs backend code quality checks and optionally tests.

**What it checks:**
- **Linting**: Ruff code quality checks
- **Formatting**: Ruff code formatting
- **Tests**: PyTest test suite (opt-in with `--with-tests`)

**Usage:**

```bash
# Run lint and format checks (default)
./scripts/testing/backend.sh

# Auto-fix linting and formatting issues
./scripts/testing/backend.sh --fix

# Include tests (requires Python environment setup)
./scripts/testing/backend.sh --with-tests

# Skip specific checks
./scripts/testing/backend.sh --no-lint
./scripts/testing/backend.sh --no-format

# Combine options
./scripts/testing/backend.sh --fix --with-tests
```

**Options:**
- `--fix`: Automatically fix linting and formatting issues
- `--with-tests`: Run PyTest test suite (requires proper Python setup)
- `--no-lint`: Skip linting checks
- `--no-format`: Skip formatting checks

> **Note:** Tests are disabled by default due to Python version management complexities with pyenv. To enable tests, ensure Poetry's dev dependencies are installed (`poetry install --with dev`) and use the `--with-tests` flag.

---

### `frontend.sh`

Runs frontend code quality checks and tests.

**What it checks:**
- **Linting**: ESLint checks for React/TypeScript
- **Type Checking**: TypeScript compiler (tsc) type validation
- **Tests**: Vitest test suite (if configured)
- **Build**: Production build validation (optional)

**Usage:**

```bash
# Run all checks
./scripts/testing/frontend.sh

# Auto-fix linting issues
./scripts/testing/frontend.sh --fix

# Include build check
./scripts/testing/frontend.sh --build

# Skip specific checks
./scripts/testing/frontend.sh --no-tests
./scripts/testing/frontend.sh --no-lint
./scripts/testing/frontend.sh --no-type-check

# Combine options
./scripts/testing/frontend.sh --fix --build
```

**Options:**
- `--fix`: Automatically fix ESLint issues
- `--build`: Run production build check
- `--no-tests`: Skip running tests
- `--no-lint`: Skip ESLint checks
- `--no-type-check`: Skip TypeScript type checking

---

## Quick Start

Make scripts executable:

```bash
chmod +x scripts/testing/*.sh
```

Run all checks with auto-fix:

```bash
./scripts/testing/backend.sh --fix
./scripts/testing/frontend.sh --fix
```

## CI/CD Integration

These scripts are designed to be used in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Backend Quality Checks
  run: ./scripts/testing/backend.sh

- name: Frontend Quality Checks
  run: ./scripts/testing/frontend.sh --build
```

## Exit Codes

- `0`: All checks passed
- `1`: One or more checks failed

## Color-Coded Output

Scripts provide color-coded output for easy scanning:
- 🟢 **Green**: Checks passed
- 🔴 **Red**: Checks failed
- 🟡 **Yellow**: Running/warnings

## Requirements

### Backend Requirements
- Poetry (Python package manager)
- Python environment configured

### Frontend Requirements
- Node.js and npm
- Dependencies installed (`npm install`)

## Troubleshooting

### Script Permission Denied

```bash
chmod +x scripts/testing/backend.sh
chmod +x scripts/testing/frontend.sh
```

### Backend Virtual Environment Issues

The scripts automatically use Poetry's virtual environment. If you encounter issues:

```bash
cd backend
poetry install
poetry run ruff check
```

### Frontend Module Not Found

Ensure dependencies are installed:

```bash
cd frontend
npm install
```

## Development Workflow

**Before committing:**

```bash
# Fix all issues automatically
./scripts/testing/backend.sh --fix
./scripts/testing/frontend.sh --fix

# Verify all checks pass
./scripts/testing/backend.sh
./scripts/testing/frontend.sh
```

**During development:**

```bash
# Quick lint check without tests
./scripts/testing/backend.sh --no-tests
./scripts/testing/frontend.sh --no-tests
```

**Before deployment:**

```bash
# Full check including build
./scripts/testing/frontend.sh --build
```

## Related Scripts

- `scripts/webapp/start.sh`: Start the full application
- `scripts/webapp/restart.sh`: Restart the application
- `scripts/webapp/health.sh`: Health check endpoint testing
