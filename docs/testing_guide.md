# Multi-Tenant System Testing Guide

## Overview

This guide covers testing strategies for the multi-tenant DocuGab system, with emphasis on **security isolation** between projects.

## Test Categories

### 1. Unit Tests (Backend)

#### A. Project Management Tests

**File**: `backend/tests/test_api/test_projects.py`

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.customer import Customer


@pytest.mark.asyncio
async def test_create_project_with_branding(
    client: AsyncClient,
    admin_token: str,
    db: AsyncSession
):
    """Test project creation with all branding fields."""
    # Create customer first
    customer = Customer(name="Test Customer", is_active=True)
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    
    response = await client.post(
        "/api/admin/projects",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "customer_id": customer.id,
            "name": "Test Project",
            "slug": "test-project",
            "subdomain": "testproject",
            "title": "Welcome to Test",
            "subtitle": "A test project",
            "color_primary": "#1976d2",
            "color_secondary": "#dc004e",
            "color_background": "#ffffff",
            "avatar": "/assets/avatars/default.glb",
            "voice": "en-US-Neural2-F",
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Project"
    assert data["subdomain"] == "testproject"
    assert data["color_primary"] == "#1976d2"


@pytest.mark.asyncio
async def test_subdomain_uniqueness(
    client: AsyncClient,
    admin_token: str,
    db: AsyncSession
):
    """Test that subdomains must be unique."""
    customer = Customer(name="Test Customer", is_active=True)
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    
    # Create first project
    project1 = Project(
        customer_id=customer.id,
        name="Project 1",
        slug="project-1",
        subdomain="mysubdomain",
        title="Title 1",
        color_primary="#000000",
        color_secondary="#ffffff",
        color_background="#ffffff",
        avatar="/default.glb",
        voice="en-US-Neural2-F",
    )
    db.add(project1)
    await db.commit()
    
    # Try to create second project with same subdomain
    response = await client.post(
        "/api/admin/projects",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "customer_id": customer.id,
            "name": "Project 2",
            "slug": "project-2",
            "subdomain": "mysubdomain",  # Duplicate!
            "title": "Title 2",
            "color_primary": "#000000",
            "color_secondary": "#ffffff",
            "color_background": "#ffffff",
            "avatar": "/default.glb",
            "voice": "en-US-Neural2-F",
        }
    )
    
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()
```

#### B. Content Isolation Tests (CRITICAL)

**File**: `backend/tests/test_security/test_content_isolation.py`

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.models.project import Project
from app.models.customer import Customer


@pytest.mark.asyncio
async def test_document_upload_requires_project(
    client: AsyncClient,
    admin_token: str
):
    """Test that document upload requires project_id."""
    # Try to upload without project_id
    files = {"file": ("test.txt", b"Test content", "text/plain")}
    
    response = await client.post(
        "/api/documents/upload",
        files=files
    )
    
    # Should fail - missing project_id
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_documents_filtered_by_project(
    client: AsyncClient,
    db: AsyncSession
):
    """Test that document listing is filtered by project_id."""
    # Create two projects
    customer = Customer(name="Test Customer", is_active=True)
    db.add(customer)
    await db.commit()
    
    project1 = Project(
        customer_id=customer.id,
        name="Project 1",
        slug="proj1",
        subdomain="proj1",
        title="P1",
        color_primary="#000000",
        color_secondary="#ffffff",
        color_background="#ffffff",
        avatar="/default.glb",
        voice="en-US-Neural2-F",
    )
    project2 = Project(
        customer_id=customer.id,
        name="Project 2",
        slug="proj2",
        subdomain="proj2",
        title="P2",
        color_primary="#000000",
        color_secondary="#ffffff",
        color_background="#ffffff",
        avatar="/default.glb",
        voice="en-US-Neural2-F",
    )
    db.add_all([project1, project2])
    await db.commit()
    await db.refresh(project1)
    await db.refresh(project2)
    
    # Create documents for each project
    doc1 = Document(
        filename="file1.txt",
        original_filename="file1.txt",
        content_type="text/plain",
        file_size=100,
        status="ready",
        project_id=project1.id
    )
    doc2 = Document(
        filename="file2.txt",
        original_filename="file2.txt",
        content_type="text/plain",
        file_size=100,
        status="ready",
        project_id=project2.id
    )
    db.add_all([doc1, doc2])
    await db.commit()
    
    # List documents for project 1
    response = await client.get(
        f"/api/documents/?project_id={project1.id}"
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["documents"]) == 1
    assert data["documents"][0]["filename"] == "file1.txt"


@pytest.mark.asyncio
async def test_chat_isolation_by_project(
    client: AsyncClient,
    db: AsyncSession
):
    """Test that chat retrieval is scoped to project documents."""
    # This test would verify that when chatting with project_id=1,
    # only documents from project 1 are searched, not project 2
    
    # Setup: Create two projects with documents
    # ... (similar to above)
    
    # Chat with project 1
    response = await client.post(
        "/api/chat/query",
        json={
            "query": "What is in the documents?",
            "project_id": 1
        }
    )
    
    assert response.status_code == 200
    # Response should only reference project 1 documents
    # Add assertions to verify sources


@pytest.mark.asyncio
async def test_no_cross_project_data_leakage(
    client: AsyncClient,
    db: AsyncSession
):
    """
    CRITICAL SECURITY TEST
    
    Verify that searching in project A never returns results from project B.
    """
    # Create two projects with distinct content
    # Upload document with sensitive content to project A
    # Upload document with different content to project B
    # Chat with project B
    # Assert that project A's sensitive content is NOT in response
    
    # This is a critical test to implement!
    pass
```

#### C. Public API Tests

**File**: `backend/tests/test_api/test_public.py`

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.customer import Customer


@pytest.mark.asyncio
async def test_get_project_by_subdomain(
    client: AsyncClient,
    db: AsyncSession
):
    """Test public project config endpoint."""
    customer = Customer(name="ACME Corp", is_active=True)
    db.add(customer)
    await db.commit()
    
    project = Project(
        customer_id=customer.id,
        name="ACME Project",
        slug="acme-project",
        subdomain="acme",
        title="Welcome to ACME",
        subtitle="Your trusted partner",
        color_primary="#ff0000",
        color_secondary="#00ff00",
        color_background="#0000ff",
        avatar="/avatars/acme.glb",
        voice="en-US-Neural2-F",
        is_active=True
    )
    db.add(project)
    await db.commit()
    
    # Public endpoint - no auth required
    response = await client.get("/api/public/projects/by-subdomain/acme")
    
    assert response.status_code == 200
    data = response.json()
    assert data["subdomain"] == "acme"
    assert data["title"] == "Welcome to ACME"
    assert data["color_primary"] == "#ff0000"
    assert data["customer_name"] == "ACME Corp"


@pytest.mark.asyncio
async def test_inactive_project_not_returned(
    client: AsyncClient,
    db: AsyncSession
):
    """Test that inactive projects are not accessible publicly."""
    customer = Customer(name="Test", is_active=True)
    db.add(customer)
    await db.commit()
    
    project = Project(
        customer_id=customer.id,
        name="Inactive",
        slug="inactive",
        subdomain="inactive",
        title="Inactive",
        color_primary="#000000",
        color_secondary="#ffffff",
        color_background="#ffffff",
        avatar="/default.glb",
        voice="en-US-Neural2-F",
        is_active=False  # Inactive
    )
    db.add(project)
    await db.commit()
    
    response = await client.get("/api/public/projects/by-subdomain/inactive")
    
    assert response.status_code == 404
```

---

### 2. Integration Tests

#### Subdomain Routing Flow

**File**: `backend/tests/integration/test_subdomain_flow.py`

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_complete_subdomain_flow(client: AsyncClient, db):
    """
    Test complete flow:
    1. Admin creates customer
    2. Admin creates project with subdomain
    3. Public accesses /api/public/projects/by-subdomain/{subdomain}
    4. Receives project config with branding
    """
    # Implementation here
    pass


@pytest.mark.asyncio
async def test_subdomain_middleware(client: AsyncClient):
    """Test that SubdomainMiddleware extracts subdomain correctly."""
    # Test with X-Subdomain header
    response = await client.get(
        "/api/public/projects/by-subdomain/test",
        headers={"X-Subdomain": "test"}
    )
    
    # Verify subdomain was detected
    # (Would need to check request.state.subdomain in actual implementation)
```

---

### 3. Frontend Tests

#### A. Unit Tests (Vitest)

**File**: `frontend/src/context/ProjectContext.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ProjectProvider, useProject } from './ProjectContext';

describe('ProjectContext', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('fetches project config by subdomain', async () => {
    const mockProject = {
      id: 1,
      subdomain: 'acme',
      title: 'ACME Project',
      color_primary: '#ff0000',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProject,
    });

    const wrapper = ({ children }: any) => (
      <ProjectProvider subdomain="acme">{children}</ProjectProvider>
    );

    const { result } = renderHook(() => useProject(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.project).toEqual(mockProject);
  });

  it('handles missing subdomain gracefully', async () => {
    const wrapper = ({ children }: any) => (
      <ProjectProvider>{children}</ProjectProvider>
    );

    const { result } = renderHook(() => useProject(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.project).toBeNull();
  });
});
```

---

### 4. Manual QA Checklist

#### Multi-Tenant Flow

- [ ] **Create Customer**
  - Admin login → /admin/customers
  - Click "Add Customer"
  - Fill form: name, contact info
  - Verify customer created

- [ ] **Create Project**
  - Admin → /admin/projects
  - Click "Add Project"
  - Select customer
  - Fill Basic Info: name, slug, subdomain
  - Fill Branding: title, subtitle, colors, logo
  - Fill Advanced: avatar, voice, return link
  - Verify project created

- [ ] **Test Subdomain Access (Local)**
  - Visit: `http://localhost:5177/?subdomain=yoursubdomain`
  - Verify branded chat loads
  - Verify correct logo, title, subtitle displayed
  - Verify theme colors applied

- [ ] **Test Document Upload**
  - Upload document to project A
  - Verify document shows in project A list
  - Verify document NOT in project B list

- [ ] **Test Chat Isolation**
  - Upload "Project A Secret Document" to project A
  - Upload "Project B Public Document" to project B
  - Chat in project B: "What documents do you have?"
  - Verify response ONLY mentions project B documents
  - Verify NO mention of project A documents

- [ ] **Test Branding**
  - Change project colors
  - Reload branded page
  - Verify colors applied to theme
  - Change logo
  - Verify logo displayed

---

### 5. Security Test Checklist

#### Critical Security Verification

- [ ] **No Cross-Project Document Access**
  - User in project A cannot see project B documents

- [ ] **No Cross-Project Chat Leakage**
  - Chat in project A doesn't retrieve project B content

- [ ] **Subdomain Isolation**
  - Accessing subdomain A shows only project A config
  - Cannot access project B via project A subdomain

- [ ] **Admin-Only Access**
  - Non-admin cannot access /admin/customers
  - Non-admin cannot access /admin/projects

- [ ] **Inactive Projects Hidden**
  - Setting project.is_active = False hides from public API
  - Subdomain returns 404 for inactive projects

---

## Running Tests

### Backend

```bash
# Run all tests
cd backend
pytest

# Run specific test file
pytest tests/test_security/test_content_isolation.py

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run only security tests
pytest -m security
```

### Frontend

```bash
# Run all tests
cd frontend
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

---

## Test Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Backend API Routes | 80%+ |
| Backend Services | 85%+ |
| Security (Content Isolation) | 100% |
| Frontend Components | 70%+ |
| Frontend Context/Hooks | 80%+ |

---

## Continuous Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -e ".[test]"
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v2

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Run tests
        run: |
          cd frontend
          npm test
```

---

## Next Steps

1. Implement security isolation tests (highest priority)
2. Add integration tests for subdomain flow
3. Write frontend component tests
4. Manual QA on local environment
5. Set up CI/CD pipeline
6. Achieve target code coverage

The security tests are **critical** - they verify that the multi-tenant isolation actually works!
