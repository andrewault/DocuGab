from pydantic import BaseModel, ConfigDict
from enum import Enum
from typing import Optional

class MediaType(str, Enum):
    photo = "photo"
    youtube = "youtube"

class MediaCreate(BaseModel):
    type: MediaType
    url: str
    description: Optional[str] = None
    keywords: list[str] = []

class MediaResponse(BaseModel):
    id: int
    project_id: int
    type: str
    url: str
    description: Optional[str]
    keywords: list[str]
    
    model_config = ConfigDict(from_attributes=True)
