from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class CandidateCreate(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

class ElectionBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    election_type: str
    start_date: datetime
    end_date: datetime
    candidates: List[dict] = []
    is_anonymous: bool = True
    allow_write_in: bool = False

class ElectionCreate(ElectionBase):
    pass

class ElectionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    election_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None
    candidates: Optional[List[dict]] = None

class ElectionResponse(ElectionBase):
    id: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class VoteRequest(BaseModel):
    voter_code: str
    candidate_id: str

class VoteResponse(BaseModel):
    message: str
    vote_hash: Optional[str] = None
