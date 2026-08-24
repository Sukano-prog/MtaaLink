from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class AnnouncementBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    message: str = Field(..., min_length=2)
    sent_via: str = "sms"
    scheduled_for: Optional[str] = None
    target_groups: Optional[List[str]] = None

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: str
    status: str
    sent_at: Optional[datetime]
    delivery_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True
