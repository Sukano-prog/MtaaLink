from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class GroupBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None

class GroupMemberResponse(BaseModel):
    id: str
    member_id: str
    member_name: str
    member_phone: str
    member_role: str
    joined_at: datetime

class GroupResponse(GroupBase):
    id: str
    village_id: str
    is_default: bool
    member_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class GroupDetailResponse(GroupResponse):
    members: List[GroupMemberResponse]
