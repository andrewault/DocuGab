import pytest
from unittest.mock import MagicMock, mock_open, AsyncMock
from app.services import storage


@pytest.fixture
def mock_upload_file():
    file = MagicMock()
    file.filename = "test.txt"
    file.read = AsyncMock(return_value=b"test content")
    return file


@pytest.mark.asyncio
async def test_save_uploaded_file(mock_upload_file, mocker):
    """Test saving a document file."""
    # Mock Path.mkdir
    mocker.patch("pathlib.Path.mkdir")

    # Mock open
    mock_file = mock_open()
    mocker.patch("builtins.open", mock_file)

    stored_filename, original_filename = await storage.save_uploaded_file(
        mock_upload_file
    )

    assert original_filename == "test.txt"
    assert stored_filename.endswith(".txt")
    # Verify file was written
    mock_file.assert_called_once()
    mock_file().write.assert_called_once_with(b"test content")


@pytest.mark.asyncio
async def test_save_avatar_file(mock_upload_file, mocker):
    """Test saving an avatar file."""
    mock_upload_file.filename = "avatar.gab"
    mocker.patch("pathlib.Path.mkdir")
    mock_file = mock_open()
    mocker.patch("builtins.open", mock_file)

    stored_filename, original_filename = await storage.save_avatar_file(
        mock_upload_file
    )

    assert stored_filename.endswith(".gab")
    mock_file().write.assert_called_once_with(b"test content")


@pytest.mark.asyncio
async def test_save_logo_file(mock_upload_file, mocker):
    """Test saving a logo file."""
    project_uuid = "123e4567-e89b-12d3-a456-426614174000"
    mocker.patch("pathlib.Path.mkdir")
    mock_file = mock_open()
    mocker.patch("builtins.open", mock_file)

    stored_filename = await storage.save_logo_file(mock_upload_file, project_uuid)

    assert stored_filename == f"{project_uuid}.png"
    mock_file().write.assert_called_once_with(b"test content")


def test_get_file_path(mocker):
    """Test getting file path."""
    expected_dir = storage.DOCUMENT_UPLOAD_DIR
    filename = "test.txt"
    path = storage.get_file_path(filename)
    assert path == expected_dir / filename
