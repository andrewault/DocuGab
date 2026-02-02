import pytest
from unittest.mock import MagicMock, AsyncMock
from app.services import processor
from app.models import Document

@pytest.fixture
def mock_db_session():
    session = AsyncMock()
    session.add = MagicMock()
    return session

@pytest.fixture
def mock_document():
    doc = Document(id=1, filename="test.pdf", status="pending")
    return doc

@pytest.fixture
def mock_pipeline_steps(mocker):
    """Mock all pipeline dependency steps."""
    mocker.patch("app.services.processor.get_file_path")
    
    extract = mocker.patch("app.services.processor.extract_text")
    extract.return_value = [{"page": 1, "content": "test content"}]
    
    chunk = mocker.patch("app.services.processor.chunk_text")
    chunk.return_value = [{"page": 1, "chunk_index": 0, "content": "test content"}]
    
    embed = mocker.patch("app.services.processor.generate_embeddings")
    embed.return_value = [[0.1, 0.2] * 384] # 768 dimensions
    
    return {"extract": extract, "chunk": chunk, "embed": embed}

@pytest.mark.asyncio
async def test_process_document_success(mock_db_session, mock_document, mock_pipeline_steps):
    """Test successful document processing."""
    # Mock db.get to return document
    mock_db_session.get.return_value = mock_document
    
    result = await processor.process_document(mock_document.id, mock_db_session)
    
    # Verify processing flow
    assert result["status"] == "ready"
    assert result["chunks_created"] == 1
    assert mock_document.status == "ready"
    
    # Verify DB interactions
    mock_db_session.commit.assert_awaited()
    mock_db_session.add.assert_called() # Should add chunks
    
    # Verify pipeline calls
    mock_pipeline_steps["extract"].assert_called_once()
    mock_pipeline_steps["chunk"].assert_called_once()
    mock_pipeline_steps["embed"].assert_awaited_once()

@pytest.mark.asyncio
async def test_process_document_not_found(mock_db_session):
    """Test handling of non-existent document."""
    mock_db_session.get.return_value = None
    
    with pytest.raises(ValueError, match="not found"):
        await processor.process_document(999, mock_db_session)

@pytest.mark.asyncio
async def test_process_document_error_handling(mock_db_session, mock_document, mock_pipeline_steps):
    """Test error handling during processing."""
    mock_db_session.get.return_value = mock_document
    
    # Make extraction fail
    mock_pipeline_steps["extract"].side_effect = Exception("Extraction failed")
    
    with pytest.raises(Exception, match="Extraction failed"):
        await processor.process_document(mock_document.id, mock_db_session)
    
    # Verify status updated to error
    assert mock_document.status == "error"
    assert "Extraction failed" in mock_document.error_message
    
    # Verify commit called to save error state
    mock_db_session.commit.assert_awaited()
