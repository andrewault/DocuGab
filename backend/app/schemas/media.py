from pydantic import BaseModel, ConfigDict
from enum import Enum
from typing import Optional
from uuid import UUID


class MediaType(str, Enum):
    photo = "photo"
    youtube = "youtube"


class MediaCreate(BaseModel):
    type: MediaType
    url: str
    description: Optional[str] = None
    keywords: list[str] = []


class ImageMetadata(BaseModel):
    filename: Optional[str] = None
    content_type: Optional[str] = None
    size_bytes: Optional[int] = None


class MediaResponse(BaseModel):
    id: int
    uuid: UUID
    project_id: int
    type: str
    url: str
    description: Optional[str]
    keywords: list[str]
    image_metadata: Optional[ImageMetadata] = None

    model_config = ConfigDict(from_attributes=True)
