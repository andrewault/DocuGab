import pytest
from unittest.mock import MagicMock, AsyncMock
from app.services import retrieval


@pytest.fixture
def mock_db_session():
    session = AsyncMock()
    return session


@pytest.fixture
def mock_embedding(mocker):
    # Patch generate_embedding to return a fixed vector
    return mocker.patch(
        "app.services.retrieval.generate_embedding", return_value=[0.1, 0.2, 0.3]
    )


@pytest.mark.asyncio
async def test_search_similar_chunks(mock_db_session, mock_embedding):
    """Test basic search functionality."""
    # Mock DB result
    mock_row = MagicMock()
    mock_row.id = 1
    mock_row.content = "Test content"
    mock_row.page_number = 1
    mock_row.document_id = 10
    mock_row.document_uuid = "uuid-123"
    mock_row.original_filename = "test.pdf"
    mock_row.similarity = 0.95

    mock_result = MagicMock()
    mock_result.fetchall.return_value = [mock_row]
    # Configure db.execute to return the mock result
    mock_db_session.execute.return_value = mock_result

    results = await retrieval.search_similar_chunks(
        query="test query", db=mock_db_session, project_id=1
    )

    assert len(results) == 1
    assert results[0]["id"] == 1
    assert results[0]["content"] == "Test content"
    assert results[0]["similarity"] == 0.95

    # Verify generate_embedding was called
    mock_embedding.assert_awaited_once_with("test query")

    # Verify execute was called
    mock_db_session.execute.assert_awaited_once()

    # Verify SQL query contains filtering by status and project_id
    call_args = mock_db_session.execute.await_args
    sql_text = str(call_args[0][0])
    params = call_args[0][1]

    assert "d.status = 'ready'" in sql_text
    assert "d.project_id = :project_id" in sql_text
    assert params["project_id"] == 1


@pytest.mark.asyncio
async def test_search_with_document_filter(mock_db_session, mock_embedding):
    """Test search with document ID filter."""
    mock_result = MagicMock()
    mock_result.fetchall.return_value = []
    mock_db_session.execute.return_value = mock_result

    await retrieval.search_similar_chunks(
        query="test", db=mock_db_session, project_id=1, document_id=99
    )

    call_args = mock_db_session.execute.await_args
    sql_text = str(call_args[0][0])
    params = call_args[0][1]

    assert "c.document_id = :doc_id" in sql_text
    assert params["doc_id"] == 99
