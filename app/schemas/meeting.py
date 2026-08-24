from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time, datetime

class MeetingBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    date: date
    time: time
    end_time: Optional[time] = None
    location: Optional[str] = None
    meeting_type: str = "general"
    agenda: Optional[str] = None
    quorum_required: int = 10
    chairperson_id: Optional[str] = None
    secretary_id: Optional[str] = None

class MeetingCreate(MeetingBase):
    pass

class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    date: Optional[date] = None
    time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    meeting_type: Optional[str] = None
    agenda: Optional[str] = None
    minutes: Optional[str] = None
    status: Optional[str] = None
    quorum_required: Optional[int] = None
    chairperson_id: Optional[str] = None
    secretary_id: Optional[str] = None

class MeetingActionItemCreate(BaseModel):
    description: str
    assigned_to: str
    due_date: Optional[date] = None
    priority: str = "medium"

class MeetingMotionCreate(BaseModel):
    title: str
    description: str
    proposed_by: str
    seconded_by: Optional[str] = None

class MeetingAttendanceCreate(BaseModel):
    member_id: str
    attended: bool = True

class MeetingResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    date: date
    time: time
    end_time: Optional[time]
    location: Optional[str]
    meeting_type: str
    status: str
    quorum_required: int
    quorum_met: bool
    total_attended: int
    chairperson_name: Optional[str]
    secretary_name: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
