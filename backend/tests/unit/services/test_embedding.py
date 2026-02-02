import pytest
from unittest.mock import MagicMock
from app.services import embedding

@pytest.fixture
def mock_embeddings_model(mocker):
    """Mock the OllamaEmbeddings model."""
    mock_model = MagicMock()
    # Mock return values for methods
    mock_model.embed_query.return_value = [0.1] * 768
    mock_model.embed_documents.return_value = [[0.1] * 768] * 2
    
    # Patch the get_embeddings_model function to return our mock
    mocker.patch("app.services.embedding.get_embeddings_model", return_value=mock_model)
    return mock_model

@pytest.mark.asyncio
async def test_generate_embedding(mock_embeddings_model):
    """Test generating a single embedding."""
    text = "Hello world"
    result = await embedding.generate_embedding(text)
    
    assert len(result) == 768
    assert result[0] == 0.1
    # Verify mock was called correctly
    mock_embeddings_model.embed_query.assert_called_once_with(text)

@pytest.mark.asyncio
async def test_generate_embeddings(mock_embeddings_model):
    """Test generating multiple embeddings."""
    texts = ["Hello", "World"]
    result = await embedding.generate_embeddings(texts)
    
    assert len(result) == 2
    assert len(result[0]) == 768
    # Verify mock was called correctly
    mock_embeddings_model.embed_documents.assert_called_once_with(texts)
