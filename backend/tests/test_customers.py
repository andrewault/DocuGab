"""
Tests for customer management endpoints.
"""
from httpx import AsyncClient
import pytest


class TestCustomerList:
    """Tests for GET /api/admin/customers"""
    
    async def test_list_customers_as_admin(self, client: AsyncClient, admin_auth_headers):
        """Test admin can list customers."""
        response = await client.get("/api/admin/customers", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "customers" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data
        assert isinstance(data["customers"], list)
    
    async def test_list_customers_pagination(self, client: AsyncClient, admin_auth_headers):
        """Test customer list pagination."""
        response = await client.get(
            "/api/admin/customers?page=1&per_page=10",
            headers=admin_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["per_page"] == 10
    
    async def test_list_customers_search(self, client: AsyncClient, admin_auth_headers):
        """Test customer list search."""
        response = await client.get(
            "/api/admin/customers?search=Demo",
            headers=admin_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "customers" in data
    
    async def test_list_customers_as_user_forbidden(self, client: AsyncClient, auth_headers):
        """Test regular user cannot list customers."""
        response = await client.get("/api/admin/customers", headers=auth_headers)
        assert response.status_code == 403
    
    async def test_list_customers_no_auth(self, client: AsyncClient):
        """Test unauthenticated access is rejected."""
        response = await client.get("/api/admin/customers")
        assert response.status_code == 401


class TestCustomerCreate:
    """Tests for POST /api/admin/customers"""
    
    async def test_create_customer(self, client: AsyncClient, admin_auth_headers):
        """Test admin can create customer."""
        customer_data = {
            "name": "Test Customer",
            "contact_name": "John Doe",
            "contact_phone": "+1-555-0123",
        }
        response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json=customer_data,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Customer"
        assert data["contact_name"] == "John Doe"
        assert data["contact_phone"] == "+1-555-0123"
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data
        assert "projects_count" in data
        assert data["projects_count"] == 0
    
    async def test_create_customer_minimal(self, client: AsyncClient, admin_auth_headers):
        """Test creating customer with only required fields."""
        customer_data = {"name": "Minimal Customer"}
        response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json=customer_data,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Minimal Customer"
        assert data["contact_name"] is None
        assert data["contact_phone"] is None
    
    async def test_create_customer_invalid_data(self, client: AsyncClient, admin_auth_headers):
        """Test creating customer with invalid data."""
        customer_data = {"name": ""}  # Empty name should fail
        response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json=customer_data,
        )
        assert response.status_code == 422  # Validation error
    
    async def test_create_customer_as_user_forbidden(self, client: AsyncClient, auth_headers):
        """Test regular user cannot create customer."""
        customer_data = {"name": "Test Customer"}
        response = await client.post(
            "/api/admin/customers",
            headers=auth_headers,
            json=customer_data,
        )
        assert response.status_code == 403


class TestCustomerGet:
    """Tests for GET /api/admin/customers/{id}"""
    
    async def test_get_customer(self, client: AsyncClient, admin_auth_headers):
        """Test admin can get customer by ID."""
        # First create a customer
        create_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Get Test Customer"},
        )
        customer_id = create_response.json()["id"]
        
        # Then fetch it
        response = await client.get(
            f"/api/admin/customers/{customer_id}",
            headers=admin_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == customer_id
        assert data["name"] == "Get Test Customer"
        assert "projects_count" in data
    
    async def test_get_nonexistent_customer(self, client: AsyncClient, admin_auth_headers):
        """Test getting non-existent customer returns 404."""
        response = await client.get(
            "/api/admin/customers/99999",
            headers=admin_auth_headers,
        )
        assert response.status_code == 404


class TestCustomerUpdate:
    """Tests for PATCH /api/admin/customers/{id}"""
    
    async def test_update_customer(self, client: AsyncClient, admin_auth_headers):
        """Test admin can update customer."""
        # Create customer
        create_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Original Name"},
        )
        customer_id = create_response.json()["id"]
        
        # Update customer
        update_data = {
            "name": "Updated Name",
            "contact_name": "Jane Smith",
            "contact_phone": "+1-555-9999",
        }
        response = await client.patch(
            f"/api/admin/customers/{customer_id}",
            headers=admin_auth_headers,
            json=update_data,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["contact_name"] == "Jane Smith"
        assert data["contact_phone"] == "+1-555-9999"
    
    async def test_update_customer_partial(self, client: AsyncClient, admin_auth_headers):
        """Test partial update of customer."""
        # Create customer
        create_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Test", "contact_name": "Original"},
        )
        customer_id = create_response.json()["id"]
        
        # Update only name
        response = await client.patch(
            f"/api/admin/customers/{customer_id}",
            headers=admin_auth_headers,
            json={"name": "New Name"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert data["contact_name"] == "Original"  # Should remain unchanged
    
    async def test_update_customer_is_active(self, client: AsyncClient, admin_auth_headers):
        """Test updating customer active status."""
        # Create customer
        create_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "Test Customer"},
        )
        customer_id = create_response.json()["id"]
        
        # Deactivate
        response = await client.patch(
            f"/api/admin/customers/{customer_id}",
            headers=admin_auth_headers,
            json={"is_active": False},
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is False
    
    async def test_update_nonexistent_customer(self, client: AsyncClient, admin_auth_headers):
        """Test updating non-existent customer returns 404."""
        response = await client.patch(
            "/api/admin/customers/99999",
            headers=admin_auth_headers,
            json={"name": "Updated"},
        )
        assert response.status_code == 404


class TestCustomerDelete:
    """Tests for DELETE /api/admin/customers/{id}"""
    
    async def test_delete_customer(self, client: AsyncClient, admin_auth_headers):
        """Test admin can delete customer."""
        # Create customer
        create_response = await client.post(
            "/api/admin/customers",
            headers=admin_auth_headers,
            json={"name": "To Delete"},
        )
        customer_id = create_response.json()["id"]
        
        # Delete
        response = await client.delete(
            f"/api/admin/customers/{customer_id}",
            headers=admin_auth_headers,
        )
        assert response.status_code == 204
        
        # Verify deleted
        get_response = await client.get(
            f"/api/admin/customers/{customer_id}",
            headers=admin_auth_headers,
        )
        assert get_response.status_code == 404
    
    async def test_delete_nonexistent_customer(self, client: AsyncClient, admin_auth_headers):
        """Test deleting non-existent customer returns 404."""
        response = await client.delete(
            "/api/admin/customers/99999",
            headers=admin_auth_headers,
        )
        assert response.status_code == 404
    
    async def test_delete_customer_as_user_forbidden(self, client: AsyncClient, auth_headers):
        """Test regular user cannot delete customer."""
        response = await client.delete(
            "/api/admin/customers/1",
            headers=auth_headers,
        )
        assert response.status_code == 403
