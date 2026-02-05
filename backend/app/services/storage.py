import uuid
import boto3
import shutil
from pathlib import Path
from fastapi import UploadFile
from app.core.config import settings

# Upload directory relative to backend (for Local storage & S3 Cache)
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
DOCUMENT_UPLOAD_DIR = UPLOAD_DIR / "documents"
AVATAR_UPLOAD_DIR = UPLOAD_DIR / "avatars"
LOGO_UPLOAD_DIR = UPLOAD_DIR / "logos"

# S3 Client (Lazy initialization)
_s3_client = None

def get_s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            region_name=settings.aws_region
        )
    return _s3_client

async def save_uploaded_file(file: UploadFile) -> tuple[str, str]:
    """Save uploaded file and return (stored_filename, original_filename)."""
    ext = Path(file.filename).suffix if file.filename else ""
    stored_filename = f"{uuid.uuid4()}{ext}"
    
    if settings.storage_backend == "s3":
        # S3 Storage
        s3 = get_s3_client()
        content = await file.read()
        # Upload directly to S3
        s3.put_object(
            Bucket=settings.s3_project_documents_bucket,
            Key=f"documents/{stored_filename}",
            Body=content
        )
    else:
        # Local Storage
        DOCUMENT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        file_path = DOCUMENT_UPLOAD_DIR / stored_filename
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

    return stored_filename, file.filename or "unknown"


async def get_file_path(filename: str) -> Path:
    """Get the full path to an uploaded file.
    
    If S3 is enabled:
    - Checks if file exists in local cache (DOCUMENT_UPLOAD_DIR).
    - If not, downloads from S3 to cache.
    - Returns local cache path.
    """
    local_path = DOCUMENT_UPLOAD_DIR / filename
    
    if settings.storage_backend == "s3":
        # Ensure cache directory exists
        DOCUMENT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        
        # Simple Cache: If file exists locally, use it.
        # In a real system, we might check ETag/LastModified, best effort for now.
        if not local_path.exists():
            s3 = get_s3_client()
            try:
                s3.download_file(
                    Bucket=settings.s3_project_documents_bucket,
                    Key=f"documents/{filename}",
                    Filename=str(local_path)
                )
            except Exception as e:
                # If download fails, it might not exist or verify permissions
                print(f"Error downloading from S3: {e}")
                # We return the path anyway, caller will handle FileNotFoundError if it's missing
                pass
                
    return local_path


async def delete_file(filename: str):
    """Delete a file from storage (and cache)."""
    # 1. Delete from local cache/storage
    local_path = DOCUMENT_UPLOAD_DIR / filename
    if local_path.exists():
        local_path.unlink()
        
    # 2. Delete from S3 if enabled
    if settings.storage_backend == "s3":
        s3 = get_s3_client()
        try:
            s3.delete_object(
                Bucket=settings.s3_project_documents_bucket,
                Key=f"documents/{filename}"
            )
        except Exception as e:
            print(f"Error deleting from S3: {e}")



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
