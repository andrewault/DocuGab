import uuid
from pathlib import Path
from fastapi import UploadFile

# Upload directory relative to backend
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
AVATAR_UPLOAD_DIR = UPLOAD_DIR / "avatars"
LOGO_UPLOAD_DIR = UPLOAD_DIR / "logos"


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


async def save_avatar_file(file: UploadFile) -> tuple[str, str]:
    """Save uploaded GAB file with UUID filename."""
    AVATAR_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    avatar_uuid = uuid.uuid4()
    stored_filename = f"{avatar_uuid}.gab"
    file_path = AVATAR_UPLOAD_DIR / stored_filename

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return stored_filename, file.filename or "unknown.gab"


def get_avatar_path(filename: str) -> Path:
    """Get full path to avatar file."""
    return AVATAR_UPLOAD_DIR / filename


async def save_logo_file(file: UploadFile, project_uuid: str) -> str:
    """Save uploaded PNG logo with project UUID filename."""
    LOGO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    stored_filename = f"{project_uuid}.png"
    file_path = LOGO_UPLOAD_DIR / stored_filename

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return stored_filename


def get_logo_path(filename: str) -> Path:
    """Get full path to logo file."""
    return LOGO_UPLOAD_DIR / filename
