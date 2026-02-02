from pydantic import BaseModel, ConfigDict
from typing import Optional

class LinkCreate(BaseModel):
    name: str
    url: str
    keywords: list[str] = []

class LinkResponse(BaseModel):
    id: int
    project_id: int
    name: str
    url: str
    keywords: list[str]
    
    model_config = ConfigDict(from_attributes=True)

class LinkUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    keywords: Optional[list[str]] = None
