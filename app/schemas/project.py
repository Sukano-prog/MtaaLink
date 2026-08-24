from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

class ProjectBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    status: str = "planning"
    priority: str = "medium"
    budget: Decimal = Field(default=0, ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    expected_completion: Optional[date] = None
    project_lead: Optional[str] = None
    meeting_id: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    budget: Optional[Decimal] = Field(None, ge=0)
    amount_spent: Optional[Decimal] = Field(None, ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    expected_completion: Optional[date] = None
    project_lead: Optional[str] = None
    progress: Optional[int] = Field(None, ge=0, le=100)

class ProjectResponse(ProjectBase):
    id: str
    amount_spent: Decimal
    progress: int
    lead_name: Optional[str]
    creator_name: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ProjectDetailResponse(ProjectResponse):
    milestones: List[dict]
    tasks: List[dict]
    contributions: List[dict]

class MilestoneBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    due_date: Optional[date] = None
    order: int = 0

class MilestoneCreate(MilestoneBase):
    pass

class TaskBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    priority: str = "medium"

class TaskCreate(TaskBase):
    milestone_id: Optional[str] = None
