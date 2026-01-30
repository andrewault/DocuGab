import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from pathlib import Path
from app.services.extraction import extract_text
from app.services.embedding import generate_embedding
from app.services.retrieval import search_similar_chunks

# --- Extraction Tests ---


@pytest.mark.asyncio
async def test_extract_text_unsupported():
    with pytest.raises(ValueError, match="Unsupported file type"):
        await extract_text(Path("test.xyz"))


# --- Embedding Tests ---


@pytest.mark.asyncio
async def test_generate_embedding():
    with patch("app.services.embedding.get_embeddings_model") as mock_get_model:
        mock_model = mock_get_model.return_value
        mock_model.embed_query.return_value = [0.1, 0.2, 0.3]

        embedding = await generate_embedding("test text")

        assert len(embedding) == 3
        assert embedding == [0.1, 0.2, 0.3]


# --- Retrieval Tests ---


@pytest.mark.asyncio
async def test_retrieval_service_search():
    # Mock DB session
    mock_session = AsyncMock()

    # Mock result row
    mock_row = MagicMock()
    mock_row.id = 1
    mock_row.content = "Found content"
    mock_row.page_number = 1
    mock_row.document_id = 1
    mock_row.document_uuid = "uuid-123"
    mock_row.original_filename = "source.txt"
    mock_row.similarity = 0.9

    # Configure execute() to return a mock result object
    mock_result = MagicMock()
    mock_result.fetchall.return_value = [mock_row]

    # Ensure execute returns this result object (as an awaitable/mock)
    mock_session.execute.return_value = mock_result

    # Mock embedding generation
    with patch(
        "app.services.retrieval.generate_embedding", new_callable=AsyncMock
    ) as mock_embed:
        mock_embed.return_value = [0.1, 0.1, 0.1]

        results = await search_similar_chunks("query", mock_session, limit=1)

        assert len(results) == 1
        assert results[0]["content"] == "Found content"
        assert results[0]["filename"] == "source.txt"
        assert results[0]["similarity"] == 0.9
