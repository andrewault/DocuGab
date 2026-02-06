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

# Allowed avatar file extensions
ALLOWED_AVATAR_EXTENSIONS = {".glb", ".fbx"}
MAX_AVATAR_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# S3 Client (Lazy initialization)
_s3_client = None

def get_s3_client():
    global _s3_client
    if _s3_client is None:
        kwargs = {"region_name": settings.aws_region}
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            kwargs["aws_access_key_id"] = settings.aws_access_key_id
            kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
            
        _s3_client = boto3.client("s3", **kwargs)
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


def validate_avatar_file(filename: str, file_size: int) -> tuple[bool, str]:
    """Validate avatar file extension and size.
    
    Returns (is_valid, error_message).
    """
    if not filename:
        return False, "Filename is required"
    
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_AVATAR_EXTENSIONS:
        return False, f"Only {', '.join(ALLOWED_AVATAR_EXTENSIONS)} files are allowed"
    
    if file_size > MAX_AVATAR_FILE_SIZE:
        return False, f"File size exceeds maximum of {MAX_AVATAR_FILE_SIZE // (1024 * 1024)}MB"
    
    return True, ""


async def save_avatar_file(file: UploadFile, avatar_uuid: str) -> tuple[str, str, int]:
    """Save uploaded avatar file (GLB/FBX) to S3 or local storage.
    
    Returns (file_path, file_extension, file_size).
    """
    original_filename = file.filename or "avatar.glb"
    ext = Path(original_filename).suffix.lower()
    stored_filename = f"{avatar_uuid}{ext}"
    
    content = await file.read()
    file_size = len(content)
    
    # Validate
    is_valid, error = validate_avatar_file(original_filename, file_size)
    if not is_valid:
        raise ValueError(error)
    
    if settings.storage_backend == "s3":
        # S3 Storage
        s3 = get_s3_client()
        s3_key = f"avatars/{stored_filename}"
        s3.put_object(
            Bucket=settings.s3_avatars_bucket,
            Key=s3_key,
            Body=content,
            ContentType="model/gltf-binary" if ext == ".glb" else "application/octet-stream"
        )
        file_path = s3_key
    else:
        # Local Storage
        AVATAR_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        local_path = AVATAR_UPLOAD_DIR / stored_filename
        with open(local_path, "wb") as f:
            f.write(content)
        file_path = stored_filename

    return file_path, ext.lstrip("."), file_size


def get_avatar_url(file_path: str) -> str:
    """Get the URL to access an avatar file."""
    if settings.storage_backend == "s3":
        # Generate a pre-signed URL for S3
        s3 = get_s3_client()
        url = s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.s3_avatars_bucket,
                "Key": file_path,
            },
            ExpiresIn=3600  # 1 hour
        )
        return url
    else:
        # Local: return relative path
        return f"/api/v1/avatars/file/{file_path}"


def get_avatar_path(filename: str) -> Path:
    """Get full path to avatar file (local storage only)."""
    return AVATAR_UPLOAD_DIR / filename


async def delete_avatar_file(file_path: str):
    """Delete an avatar file from storage."""
    if settings.storage_backend == "s3":
        s3 = get_s3_client()
        try:
            s3.delete_object(
                Bucket=settings.s3_avatars_bucket,
                Key=file_path
            )
        except Exception as e:
            print(f"Error deleting avatar from S3: {e}")
    else:
        local_path = AVATAR_UPLOAD_DIR / file_path
        if local_path.exists():
            local_path.unlink()


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
