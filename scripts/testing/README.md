# Testing Scripts

Scripts for running tests across the DocuGab project.

## Quick Start

```bash
# Run all tests
./scripts/testing/backend/run-tests.sh
./scripts/testing/frontend/run-tests.sh

# Or from project root
cd backend && PYTHONPATH=. uv run pytest
cd frontend && npm test
```

## Structure

```
scripts/testing/
├── README.md           # This file
├── backend/
│   ├── README.md       # Backend testing docs
│   └── run-tests.sh    # Backend test runner
└── frontend/
    ├── README.md       # Frontend testing docs
    └── run-tests.sh    # Frontend test runner
```

## Test Coverage

| Component | Framework | Tests |
|-----------|-----------|-------|
| Backend | pytest + pytest-asyncio | 23 |
| Frontend | Vitest + React Testing Library | 13 |
