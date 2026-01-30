from pathlib import Path
from pypdf import PdfReader
from docx import Document as DocxDocument


def extract_text(file_path: Path) -> list[dict]:
    """Extract text from file, returning list of {page, content}."""
    ext = file_path.suffix.lower()

    if ext == ".pdf":
        return extract_pdf(file_path)
    elif ext == ".docx":
        return extract_docx(file_path)
    elif ext in (".txt", ".md"):
        return extract_text_file(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def extract_pdf(file_path: Path) -> list[dict]:
    """Extract text from PDF, page by page."""
    reader = PdfReader(str(file_path))
    pages = []
    for i, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ""
        if text.strip():
            pages.append({"page": i, "content": text})
    return pages


def extract_docx(file_path: Path) -> list[dict]:
    """Extract text from DOCX document."""
    doc = DocxDocument(str(file_path))
    text = "\n".join(p.text for p in doc.paragraphs)
    return [{"page": 1, "content": text}]


def extract_text_file(file_path: Path) -> list[dict]:
    """Extract text from plain text or markdown file."""
    text = file_path.read_text(encoding="utf-8")
    return [{"page": 1, "content": text}]
