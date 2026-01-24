import uuid
from pathlib import Path
from fastapi import UploadFile

# Upload directory relative to backend
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"


async def save_uploaded_file(file: UploadFile) -> tuple[str, str]:
    """Save uploaded file and return (stored_filename, original_filename)."""
    UPLOAD_DIR.mkdir(exist_ok=True)
    
    ext = Path(file.filename).suffix if file.filename else ""
    stored_filename = f"{uuid.uuid4()}{ext}"
    file_path = UPLOAD_DIR / stored_filename
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    return stored_filename, file.filename or "unknown"


def get_file_path(filename: str) -> Path:
    """Get the full path to an uploaded file."""
    return UPLOAD_DIR / filename
