"""
Tests for authentication endpoints.
"""
import pytest
from httpx import AsyncClient


class TestAuthRegister:
    """Tests for POST /api/auth/register"""
    
    async def test_register_success(self, client: AsyncClient):
        """Test successful user registration."""
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123",
                "full_name": "New User",
            },
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert "password" not in data
        assert "password_hash" not in data
    
    async def test_register_duplicate_email(self, client: AsyncClient, test_user):
        """Test registration fails with duplicate email."""
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",  # Already exists
                "password": "anotherpassword",
            },
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    async def test_register_invalid_email(self, client: AsyncClient):
        """Test registration fails with invalid email."""
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "notanemail",
                "password": "password123",
            },
        )
        assert response.status_code == 422


class TestAuthLogin:
    """Tests for POST /api/auth/login"""
    
    async def test_login_success(self, client: AsyncClient, test_user):
        """Test successful login."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "testpassword"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    
    async def test_login_wrong_password(self, client: AsyncClient, test_user):
        """Test login fails with wrong password."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401
    
    async def test_login_user_not_found(self, client: AsyncClient):
        """Test login fails for non-existent user."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "password"},
        )
        assert response.status_code == 401


class TestAuthMe:
    """Tests for GET /api/auth/me"""
    
    async def test_get_current_user(self, client: AsyncClient, auth_headers):
        """Test getting current user info."""
        response = await client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"
        assert "password" not in data
        assert "password_hash" not in data
    
    async def test_get_current_user_no_auth(self, client: AsyncClient):
        """Test getting current user without auth fails."""
        response = await client.get("/api/auth/me")
        assert response.status_code == 401


class TestAuthRefresh:
    """Tests for POST /api/auth/refresh"""
    
    async def test_refresh_token(self, client: AsyncClient, test_user):
        """Test token refresh."""
        # First login to get tokens
        login_response = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "testpassword"},
        )
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    
    async def test_refresh_invalid_token(self, client: AsyncClient):
        """Test refresh fails with invalid token."""
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": "invalid-token"},
        )
        assert response.status_code == 401
