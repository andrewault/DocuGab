"""
Tests for health endpoint.
"""

from httpx import AsyncClient


class TestHealth:
    """Tests for GET /health"""

    async def test_health_check(self, client: AsyncClient):
        """Test health endpoint returns OK."""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
