import os
import shutil
import uuid
import mimetypes

from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.image import Image

router = APIRouter()

UPLOAD_DIR = Path("uploads/images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload", response_model=dict)
async def upload_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate UUID and filename
    file_uuid = uuid.uuid4()
    extension = mimetypes.guess_extension(file.content_type) or os.path.splitext(file.filename)[1]
    secure_filename = f"{file_uuid}{extension}"
    file_path = UPLOAD_DIR / secure_filename

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        print(f"Error saving file: {e}")
        raise HTTPException(status_code=500, detail="Could not save file")

    # Save metadata to DB
    image = Image(
        uuid=file_uuid,
        original_filename=file.filename,
        file_path=str(file_path),
        content_type=file.content_type
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)

    # Return URL (internal API URL)
    # The frontend will use this URL to display the image
    # We construct it based on the API base URL if available, otherwise relative
    image_url = f"/api/v1/images/{image.uuid}"
    
    return {
        "uuid": str(image.uuid),
        "url": image_url,
        "original_filename": image.original_filename
    }

@router.get("/{image_uuid}")
async def get_image(
    image_uuid: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    # Optional: require auth or make public? 
    # User requirement: "accessible from the app" - usually implies auth or token.
    # For simplicity and to allow <img> tags to work easily, we might allow public access if the UUID is known,
    # OR we require a cookie/token. Since <img> tags in the browser will include cookies/headers if configured,
    # let's require at least a valid user for now to check security, or allow if it's meant to be public.
    # Given the context of "Ancillary Responses" in a private chat, it should probably be protected.
    # However, standard <img> tags don't easily send Bearer tokens without interception.
    # Cookie-based auth would work. If using Bearer tokens, we'd need a signed URL or similar.
    # For this iteration, I'll allow access but maybe we should rely on the random UUID as a "capability URL" (security through obscurity) 
    # if standard <img> tags are used.
    # Let's try without Depends(get_current_user) for the GET endpoint to facilitate easy <img> rendering,
    # relying on the UUID being hard to guess. This is a common pattern for resource serving.
):
    result = await db.execute(select(Image).where(Image.uuid == image_uuid))
    image = result.scalar_one_or_none()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    if not os.path.exists(image.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(image.file_path, media_type=image.content_type)
