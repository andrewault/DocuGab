"""
Tests for document endpoints.
"""

from httpx import AsyncClient


class TestDocumentList:
    """Tests for GET /api/documents/"""

    async def test_list_documents_empty(self, client: AsyncClient):
        """Test listing documents when none exist."""
        response = await client.get("/api/documents/")
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
        assert data["documents"] == []


class TestDocumentUpload:
    """Tests for POST /api/documents/upload"""

    async def test_upload_txt_file(self, client: AsyncClient, admin_auth_headers):
        """Test uploading a text file."""
        # Create customer and project first
        customer_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Test Customer"},
        )
        customer_id = customer_response.json()["id"]

        project_response = await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json={
                "customer_id": customer_id,
                "name": "Test Project",
                "slug": "test-project",
                "subdomain": "test-upload",
                "title": "Test Title",
                "subtitle": "Test Subtitle",
                "body": "Test body",
                "color_primary": "#1976d2",
                "color_secondary": "#dc004e",
                "color_background": "#ffffff",
                "avatar": "/assets/avatars/test.glb",
                "voice": "en-US-Neural2-F",
            },
        )
        assert project_response.status_code == 201, (
            f"Project creation failed: {project_response.json()}"
        )
        project_id = project_response.json()["id"]

        # Upload document
        content = b"This is test content for the document."
        files = {"file": ("test.txt", content, "text/plain")}

        response = await client.post(
            f"/api/documents/upload?project_id={project_id}", files=files
        )
        assert response.status_code == 200
        response_data = response.json()
        assert response_data["filename"] == "test.txt"
        assert response_data["status"] == "pending"

    async def test_upload_unsupported_type(
        self, client: AsyncClient, admin_auth_headers
    ):
        """Test uploading unsupported file type fails."""
        # Create customer and project first
        customer_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Test Customer"},
        )
        customer_id = customer_response.json()["id"]

        project_response = await client.post(
            "/api/admin/projects",
            headers=admin_auth_headers,
            json={
                "customer_id": customer_id,
                "name": "Test Project",
                "slug": "test-project",
                "subdomain": "test-unsupported",
                "title": "Test Title",
                "subtitle": "Test Subtitle",
                "body": "Test body",
                "color_primary": "#1976d2",
                "color_secondary": "#dc004e",
                "color_background": "#ffffff",
                "avatar": "/assets/avatars/test.glb",
                "voice": "en-US-Neural2-F",
            },
        )
        assert project_response.status_code == 201, (
            f"Project creation failed: {project_response.json()}"
        )
        project_id = project_response.json()["id"]

        # Try to upload unsupported file type
        content = b"Some binary content"
        files = {"file": ("test.jpg", content, "image/jpeg")}

        response = await client.post(
            f"/api/documents/upload?project_id={project_id}", files=files
        )
        assert response.status_code == 400
        detail = response.json().get("detail", "").lower()
        assert "not supported" in detail or "invalid" in detail or "allowed" in detail


class TestDocumentDelete:
    """Tests for DELETE /api/documents/{id}"""

    async def test_delete_nonexistent(self, client: AsyncClient):
        """Test deleting non-existent document returns 404."""
        response = await client.delete("/api/documents/99999")
        assert response.status_code == 404
