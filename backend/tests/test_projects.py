"""
Tests for project management endpoints.
"""

from httpx import AsyncClient


# Test data
VALID_PROJECT_DATA = {
    "customer_id": 1,
    "name": "Test Project",
    "slug": "test-project",
    "subdomain": "test-proj",
    "title": "Test Title",
    "subtitle": "Test Subtitle",
    "body": "Test body content",
    "color_primary": "#1976d2",
    "color_secondary": "#dc004e",
    "color_background": "#ffffff",
    "avatar": "/assets/avatars/test.glb",
    "voice": "en-US-Neural2-F",
}


class TestProjectList:
    """Tests for GET /api/admin/projects"""

    async def test_list_projects_as_admin(
        self, client: AsyncClient, admin_auth_headers
    ):
        """Test admin can list projects."""
        response = await client.get("/api/admin/projects", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data
        assert isinstance(data["projects"], list)

    async def test_list_projects_pagination(
        self, client: AsyncClient, admin_auth_headers
    ):
        """Test project list pagination."""
        response = await client.get(
            "/api/admin/projects?page=1&per_page=10",
            headers=admin_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["per_page"] == 10

    async def test_list_projects_filter_by_customer(
        self, client: AsyncClient, admin_auth_headers
    ):
        """Test filtering projects by customer ID."""
        response = await client.get(
            "/api/admin/projects?customer_id=1",
            headers=admin_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data

    async def test_list_projects_search(self, client: AsyncClient, admin_auth_headers):
        """Test project search."""
        response = await client.get(
            "/api/admin/projects?search=demo",
            headers=admin_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data

    async def test_list_projects_as_user_forbidden(
        self, client: AsyncClient, auth_headers
    ):
        """Test regular user cannot list projects."""
        response = await client.get("/api/admin/projects", headers=auth_headers)
        assert response.status_code == 403


class TestProjectCreate:
    """Tests for POST /api/admin/projects"""

    async def test_create_project(self, client: AsyncClient, admin_auth_headers):
        """Test admin can create project."""
        # First create a customer
        customer_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Test Customer"},
        )
        customer_id = customer_response.json()["id"]

        # Create project
        project_data = {**VALID_PROJECT_DATA, "customer_id": customer_id}
        response = await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json=project_data,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Project"
        assert data["subdomain"] == "test-proj"
        assert data["title"] == "Test Title"
        assert data["color_primary"] == "#1976d2"
        assert data["is_active"] is True
        assert "id" in data
        assert "documents_count" in data
        assert data["documents_count"] == 0

    async def test_create_project_invalid_customer(
        self, client: AsyncClient, admin_auth_headers
    ):
        """Test creating project with non-existent customer fails."""
        project_data = {**VALID_PROJECT_DATA, "customer_id": 99999}
        response = await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json=project_data,
        )
        assert response.status_code == 404

    async def test_create_project_duplicate_subdomain(
        self, client: AsyncClient, admin_auth_headers
    ):
        """Test creating project with duplicate subdomain fails."""
        # Create customer
        customer_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Test Customer"},
        )
        customer_id = customer_response.json()["id"]

        # Create first project
        project_data = {**VALID_PROJECT_DATA, "customer_id": customer_id}
        await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json=project_data,
        )

        # Try to create second with same subdomain
        response = await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json=project_data,
        )
        assert response.status_code == 409

    async def test_create_project_invalid_subdomain(
        self, client: AsyncClient, admin_auth_headers
    ):
        """Test creating project with invalid subdomain fails."""
        customer_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Test Customer"},
        )
        customer_id = customer_response.json()["id"]

        invalid_data = {
            **VALID_PROJECT_DATA,
            "customer_id": customer_id,
            "subdomain": "Invalid_Subdomain!",
        }
        response = await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json=invalid_data,
        )
        assert response.status_code == 422

    async def test_create_project_invalid_color(
        self, client: AsyncClient, admin_auth_headers
    ):
        """Test creating project with invalid hex color fails."""
        customer_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Test Customer"},
        )
        customer_id = customer_response.json()["id"]

        invalid_data = {
            **VALID_PROJECT_DATA,
            "customer_id": customer_id,
            "color_primary": "red",
        }
        response = await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json=invalid_data,
        )
        assert response.status_code == 422


class TestProjectGet:
    """Tests for GET /api/admin/projects/{id}"""

    async def test_get_project(self, client: AsyncClient, admin_auth_headers):
        """Test admin can get project by ID."""
        # Create customer
        customer_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Test Customer"},
        )
        customer_id = customer_response.json()["id"]

        # Create project
        project_data = {
            **VALID_PROJECT_DATA,
            "customer_id": customer_id,
            "subdomain": "get-test",
        }
        create_response = await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json=project_data,
        )
        project_uuid = create_response.json()["uuid"]

        # Fetch project
        response = await client.get(
            f"/api/admin/projects/{project_uuid}",
            headers=admin_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["uuid"] == project_uuid
        assert data["customer_name"] == "Test Customer"
        assert "documents_count" in data

    async def test_get_nonexistent_project(
        self, client: AsyncClient, admin_auth_headers
    ):
        """Test getting non-existent project returns 404."""
        response = await client.get(
            "/api/admin/projects/00000000-0000-0000-0000-000000000000",
            headers=admin_auth_headers,
        )
        assert response.status_code == 404


class TestProjectUpdate:
    """Tests for PATCH /api/admin/projects/{id}"""

    async def test_update_project(self, client: AsyncClient, admin_auth_headers):
        """Test admin can update project."""
        # Create customer and project
        customer_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Test Customer"},
        )
        customer_id = customer_response.json()["id"]

        project_data = {
            **VALID_PROJECT_DATA,
            "customer_id": customer_id,
            "subdomain": "update-test",
        }
        create_response = await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json=project_data,
        )
        project_uuid = create_response.json()["uuid"]

        # Update project
        update_data = {
            "title": "Updated Title",
            "color_primary": "#ff5722",
        }
        response = await client.patch(
            f"/api/admin/projects/{project_uuid}",
            headers=admin_auth_headers,
            json=update_data,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["color_primary"] == "#ff5722"
        assert data["name"] == "Test Project"  # Unchanged

    async def test_update_project_subdomain(
        self, client: AsyncClient, admin_auth_headers
    ):
        """Test updating project subdomain."""
        # Create customer and project
        customer_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Test Customer"},
        )
        customer_id = customer_response.json()["id"]

        project_data = {
            **VALID_PROJECT_DATA,
            "customer_id": customer_id,
            "subdomain": "old-subdomain",
        }
        create_response = await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json=project_data,
        )
        project_uuid = create_response.json()["uuid"]

        # Update subdomain
        response = await client.patch(
            f"/api/admin/projects/{project_uuid}",
            headers=admin_auth_headers,
            json={"subdomain": "new-subdomain"},
        )
        assert response.status_code == 200
        assert response.json()["subdomain"] == "new-subdomain"

    async def test_update_project_duplicate_subdomain(
        self, client: AsyncClient, admin_auth_headers
    ):
        """Test updating project to duplicate subdomain fails."""
        # Create customer and two projects
        customer_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Test Customer"},
        )
        customer_id = customer_response.json()["id"]

        # Project 1
        project1_data = {
            **VALID_PROJECT_DATA,
            "customer_id": customer_id,
            "subdomain": "proj1",
        }
        await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json=project1_data,
        )

        # Project 2
        project2_data = {
            **VALID_PROJECT_DATA,
            "customer_id": customer_id,
            "subdomain": "proj2",
        }
        create_response = await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json=project2_data,
        )
        project2_uuid = create_response.json()["uuid"]

        # Try to update project2's subdomain to proj1
        response = await client.patch(
            f"/api/admin/projects/{project2_uuid}",
            headers=admin_auth_headers,
            json={"subdomain": "proj1"},
        )
        assert response.status_code == 409


class TestProjectDelete:
    """Tests for DELETE /api/admin/projects/{id}"""

    async def test_delete_project(self, client: AsyncClient, admin_auth_headers):
        """Test admin can delete project."""
        # Create customer and project
        customer_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Test Customer"},
        )
        customer_id = customer_response.json()["id"]

        project_data = {
            **VALID_PROJECT_DATA,
            "customer_id": customer_id,
            "subdomain": "delete-test",
        }
        create_response = await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json=project_data,
        )
        project_uuid = create_response.json()["uuid"]

        # Delete
        response = await client.delete(
            f"/api/admin/projects/{project_uuid}",
            headers=admin_auth_headers,
        )
        assert response.status_code == 204

        # Verify deleted
        get_response = await client.get(
            f"/api/admin/projects/{project_uuid}",
            headers=admin_auth_headers,
        )
        assert get_response.status_code == 404

    async def test_delete_nonexistent_project(
        self, client: AsyncClient, admin_auth_headers
    ):
        """Test deleting non-existent project returns 404."""
        response = await client.delete(
            "/api/admin/projects/00000000-0000-0000-0000-000000000000",
            headers=admin_auth_headers,
        )
        assert response.status_code == 404
