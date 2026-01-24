# Backend Testing

## Stack

- **pytest** — Test framework
- **pytest-asyncio** — Async test support
- **aiosqlite** — In-memory SQLite for fast tests
- **httpx** — Async HTTP client for API testing

## Run Tests

```bash
# From project root
./scripts/testing/backend/run-tests.sh

# Or manually
cd backend
PYTHONPATH=. uv run pytest

# With options
PYTHONPATH=. uv run pytest -v              # Verbose
PYTHONPATH=. uv run pytest --tb=long       # Full tracebacks
PYTHONPATH=. uv run pytest -k "auth"       # Filter by name
```

## Test Structure

```
backend/tests/
├── conftest.py         # Fixtures (db, client, users)
├── test_auth.py        # Auth endpoint tests
├── test_admin.py       # Admin endpoint tests
├── test_documents.py   # Document endpoint tests
└── test_health.py      # Health check tests
```

## Fixtures

| Fixture | Description |
|---------|-------------|
| `db_session` | Async SQLite session |
| `client` | Async HTTP test client |
| `test_user` | Regular user fixture |
| `admin_user` | Admin user fixture |
| `auth_headers` | Auth headers for test_user |
| `admin_auth_headers` | Auth headers for admin |

## Adding Tests

```python
import pytest
from httpx import AsyncClient

class TestMyFeature:
    async def test_something(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/my-endpoint", headers=auth_headers)
        assert response.status_code == 200
```
