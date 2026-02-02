# Testing Improvement Plan

## Overview

This document outlines the strategy for improving test coverage across the DocuGab platform, focusing on backend unit tests, API integration tests, and end-to-end user flow validation.

## Current State

- Limited backend unit test coverage
- No systematic integration testing of API endpoints
- No E2E tests for critical user journeys
- Manual testing for most features

## Goals

### Test Coverage Targets

- **Backend Unit Tests**: Achieve 80%+ code coverage
- **Integration Tests**: Cover all critical API endpoints
- **E2E Tests**: Automate critical user flows

## Implementation Plan

### Phase 1: Backend Unit Tests (80%+ Coverage)

#### Priority Areas

1. **Business Logic & Services**
   - `app/services/embedding.py` - Vector embedding generation
   - `app/services/retrieval.py` - RAG retrieval logic
   - `app/services/storage.py` - File storage operations
   - `app/core/security.py` - Password hashing, token generation

2. **Models & Schema Validation**
   - Pydantic schema validation
   - SQLAlchemy model constraints
   - Data transformations and serialization

3. **Utilities & Helpers**
   - `app/utils/*` - Helper functions
   - Custom validators
   - Data formatting utilities

#### Testing Framework

- **Framework**: pytest
- **Coverage Tool**: pytest-cov
- **Mocking**: pytest-mock, unittest.mock
- **Fixtures**: Use pytest fixtures for database, auth, and common setup

#### Coverage Commands

```bash
# Run tests with coverage report
cd backend
uv run pytest --cov=app --cov-report=html --cov-report=term

# View coverage report
open htmlcov/index.html
```

#### Example Test Structure

```python
# tests/services/test_embedding.py
import pytest
from app.services.embedding import generate_embeddings

@pytest.mark.asyncio
async def test_generate_embeddings_success():
    text = "Sample document text"
    embeddings = await generate_embeddings(text)
    assert len(embeddings) == 1536  # Expected vector dimension
    assert all(isinstance(x, float) for x in embeddings)

@pytest.mark.asyncio
async def test_generate_embeddings_empty_text():
    with pytest.raises(ValueError):
        await generate_embeddings("")
```

### Phase 2: Integration Tests (API Endpoints)

#### Critical Endpoints to Test

1. **Authentication**
   - `POST /api/auth/login` - Login with valid/invalid credentials
   - `POST /api/auth/register` - User registration
   - `POST /api/auth/refresh` - Token refresh
   - `POST /api/auth/logout` - Logout

2. **Documents**
   - `POST /api/documents/upload` - Document upload and processing
   - `GET /api/documents` - List documents with pagination
   - `GET /api/documents/{uuid}` - Get document details
   - `DELETE /api/documents/{uuid}` - Delete document

3. **Chat**
   - `POST /api/chat/message` - Send chat message
   - `GET /api/chat/sessions` - List chat sessions
   - `GET /api/chat/sessions/{uuid}/messages` - Get session messages

4. **Admin**
   - `GET /api/admin/users` - List users (admin only)
   - `PATCH /api/admin/users/{uuid}` - Update user
   - `GET /api/admin/customers` - List customers

5. **Customer Account**
   - `GET /api/customer/account` - Get account info
   - `POST /api/customer/account/invite` - Invite user
   - `PATCH /api/customer/account/users/{uuid}` - Update user info

#### Testing Approach

- Use FastAPI TestClient for API testing
- Test authentication/authorization for protected endpoints
- Validate response schemas and status codes
- Test error handling and edge cases

#### Example Integration Test

```python
# tests/api/test_documents.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_upload_document_success(auth_headers, sample_pdf):
    response = client.post(
        "/api/documents/upload",
        files={"file": ("test.pdf", sample_pdf, "application/pdf")},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "uuid" in data
    assert data["filename"] == "test.pdf"

def test_upload_document_unauthorized():
    response = client.post("/api/documents/upload")
    assert response.status_code == 401
```

### Phase 3: E2E Tests (Critical User Flows)

#### Framework Selection

**Recommended: Playwright**
- Better async support for modern web apps
- Auto-wait for elements
- Built-in network interception
- Multiple browser support

Alternative: Cypress (if Playwright doesn't fit needs)

#### Critical User Flows

1. **Login Flow**
   - Navigate to login page
   - Enter valid credentials
   - Verify redirect to dashboard
   - Verify auth token stored
   - Test invalid credentials
   - Test logout

2. **Document Upload and Processing**
   - Login as customer user
   - Navigate to documents page
   - Upload PDF document
   - Verify upload success
   - Wait for processing completion
   - Verify document appears in list

3. **Chat Interactions**
   - Login as customer user
   - Navigate to chat / test chat
   - Send message to AI
   - Verify AI response received
   - Verify message history persisted
   - Test with/without documents

4. **Admin CRUD Operations**
   - Login as admin user
   - Create new customer
   - Create new user for customer
   - Edit user details
   - Deactivate user
   - Delete user
   - Verify all changes persist

#### E2E Test Structure

```typescript
// e2e/tests/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('http://localhost:5177/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/customer$/);
    await expect(page.locator('h4')).toContainText('Dashboard');
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('http://localhost:5177/login');
    
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.MuiAlert-root')).toBeVisible();
    await expect(page.locator('.MuiAlert-root')).toContainText('Invalid');
  });
});
```

#### E2E Setup

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Run tests
npx playwright test

# Run with UI
npx playwright test --ui

# Generate test report
npx playwright show-report
```

## Implementation Timeline

### Week 1-2: Backend Unit Tests Foundation
- Set up pytest configuration and fixtures
- Write tests for core services (embedding, retrieval, storage)
- Achieve 50% coverage baseline

### Week 3-4: Backend Unit Tests Completion
- Test remaining services and utilities
- Test models and validators
- Reach 80%+ coverage target

### Week 5-6: Integration Tests
- Set up integration test framework
- Write tests for auth and document endpoints
- Test admin and customer endpoints

### Week 7-8: E2E Tests
- Set up Playwright
- Implement login and document upload flows
- Implement chat and admin flows

## Maintenance & CI/CD Integration

### Continuous Integration

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run backend tests
        run: |
          cd backend
          uv run pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run E2E tests
        run: npx playwright test
```

### Coverage Requirements

- PR must maintain or improve coverage
- No PR merge if coverage drops below 75%
- Critical paths must have 90%+ coverage

## Success Metrics

- ✅ Backend unit test coverage ≥ 80%
- ✅ All critical API endpoints have integration tests
- ✅ All 4 critical user flows have E2E tests
- ✅ Tests run in CI/CD pipeline
- ✅ Test execution time < 5 minutes total

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [FastAPI testing guide](https://fastapi.tiangolo.com/tutorial/testing/)
- [Playwright documentation](https://playwright.dev/)
- [pytest-cov](https://pytest-cov.readthedocs.io/)
