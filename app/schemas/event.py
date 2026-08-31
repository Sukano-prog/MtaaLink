from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import date, datetime
from decimal import Decimal

class EventBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    event_type: str
    date: date
    time: Optional[datetime] = None
    location: Optional[str] = None
    organizer: Optional[str] = None
    notes: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    event_type: Optional[str] = None
    date: Optional[Union[date, str]] = None
    time: Optional[datetime] = None
    location: Optional[str] = None
    status: Optional[str] = None
    organizer: Optional[str] = None
    notes: Optional[str] = None

class EventResponse(EventBase):
    id: str
    status: str
    organizer_name: Optional[str]
    created_at: datetime
    attendance_count: int = 0
    contribution_count: int = 0
    total_contributions: Decimal = Decimal(0)
    
    class Config:
        from_attributes = True

class EventAttendanceCreate(BaseModel):
    member_id: str
    role: Optional[str] = None

class EventContributionCreate(BaseModel):
    member_id: Optional[str] = None
    member_name: Optional[str] = None
    member_phone: Optional[str] = None
    contribution_type: str
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    value_estimate: Optional[Decimal] = None
    payment_date: Optional[str] = None
    payment_method: Optional[str] = None
    recorded_by: Optional[str] = None
