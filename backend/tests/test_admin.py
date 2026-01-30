"""
Tests for admin endpoints.
"""

from httpx import AsyncClient


class TestAdminStats:
    """Tests for GET /api/admin/stats"""

    async def test_stats_as_admin(self, client: AsyncClient, admin_auth_headers):
        """Test admin can access stats."""
        response = await client.get("/api/admin/stats", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_documents" in data

    async def test_stats_as_user_forbidden(self, client: AsyncClient, auth_headers):
        """Test regular user cannot access admin stats."""
        response = await client.get("/api/admin/stats", headers=auth_headers)
        assert response.status_code == 403

    async def test_stats_no_auth(self, client: AsyncClient):
        """Test unauthenticated access is rejected."""
        response = await client.get("/api/admin/stats")
        assert response.status_code == 401


class TestAdminUserList:
    """Tests for GET /api/admin/users"""

    async def test_list_users_as_admin(
        self, client: AsyncClient, admin_auth_headers, test_user
    ):
        """Test admin can list users."""
        response = await client.get("/api/admin/users", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert len(data["users"]) >= 1


class TestAdminUserUpdate:
    """Tests for PATCH /api/admin/users/{id}"""

    async def test_update_user_role(
        self, client: AsyncClient, admin_auth_headers, test_user
    ):
        """Test admin can update user role."""
        response = await client.patch(
            f"/api/admin/users/{test_user.id}",
            headers=admin_auth_headers,
            json={"role": "admin"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"

    async def test_update_nonexistent_user(
        self, client: AsyncClient, admin_auth_headers
    ):
        """Test updating non-existent user returns 404."""
        response = await client.patch(
            "/api/admin/users/99999",
            headers=admin_auth_headers,
            json={"role": "admin"},
        )
        assert response.status_code == 404


class TestAdminUserDelete:
    """Tests for DELETE /api/admin/users/{id}"""

    async def test_delete_user(
        self, client: AsyncClient, admin_auth_headers, test_user
    ):
        """Test admin can delete user."""
        response = await client.delete(
            f"/api/admin/users/{test_user.id}",
            headers=admin_auth_headers,
        )
        assert response.status_code in [200, 204]

    async def test_regular_user_cannot_delete(
        self, client: AsyncClient, auth_headers, admin_user
    ):
        """Test regular user cannot delete other users."""
        response = await client.delete(
            f"/api/admin/users/{admin_user.id}",
            headers=auth_headers,
        )
        assert response.status_code == 403
