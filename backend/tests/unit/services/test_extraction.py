import pytest
from unittest.mock import MagicMock
from pathlib import Path
from app.services import extraction


@pytest.fixture
def mock_path(mocker):
    path = MagicMock(spec=Path)
    path.suffix = ".txt"
    return path


def test_extract_text_txt(mock_path, mocker):
    """Test extracting text from TXT file."""
    mock_path.suffix = ".txt"
    mock_path.read_text.return_value = "File content"

    result = extraction.extract_text(mock_path)

    assert len(result) == 1
    assert result[0]["content"] == "File content"
    assert result[0]["page"] == 1


def test_extract_text_pdf(mock_path, mocker):
    """Test extracting text from PDF."""
    mock_path.suffix = ".pdf"
    mock_path.__str__.return_value = "dummy.pdf"

    # Mock PdfReader
    mock_reader = MagicMock()
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "Page text"
    mock_reader.pages = [mock_page]

    mocker.patch("app.services.extraction.PdfReader", return_value=mock_reader)

    result = extraction.extract_text(mock_path)

    assert len(result) == 1
    assert result[0]["content"] == "Page text"
    assert result[0]["page"] == 1


def test_extract_text_docx(mock_path, mocker):
    """Test extracting text from DOCX."""
    mock_path.suffix = ".docx"
    mock_path.__str__.return_value = "dummy.docx"

    # Mock DocxDocument
    mock_doc = MagicMock()
    mock_para = MagicMock()
    mock_para.text = "Paragraph text"
    mock_doc.paragraphs = [mock_para]

    mocker.patch("app.services.extraction.DocxDocument", return_value=mock_doc)

    result = extraction.extract_text(mock_path)

    assert len(result) == 1
    assert result[0]["content"] == "Paragraph text"
    assert result[0]["page"] == 1


def test_extract_unsupported(mock_path):
    """Test unsupported file type raises error."""
    mock_path.suffix = ".exe"

    with pytest.raises(ValueError):
        extraction.extract_text(mock_path)
