"""
Tests for document endpoints.
"""
import pytest
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
    
    async def test_upload_txt_file(self, client: AsyncClient):
        """Test uploading a text file."""
        content = b"This is test content for the document."
        files = {"file": ("test.txt", content, "text/plain")}
        
        response = await client.post("/api/documents/upload", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "test.txt"
        assert data["status"] == "pending"
    
    async def test_upload_unsupported_type(self, client: AsyncClient):
        """Test uploading unsupported file type fails."""
        content = b"Some binary content"
        files = {"file": ("test.jpg", content, "image/jpeg")}
        
        response = await client.post("/api/documents/upload", files=files)
        assert response.status_code == 400
        detail = response.json().get("detail", "").lower()
        assert "not supported" in detail or "invalid" in detail or "allowed" in detail


class TestDocumentDelete:
    """Tests for DELETE /api/documents/{id}"""
    
    async def test_delete_nonexistent(self, client: AsyncClient):
        """Test deleting non-existent document returns 404."""
        response = await client.delete("/api/documents/99999")
        assert response.status_code == 404
