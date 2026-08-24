from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class ContributionTypeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    category: str = "general"

class ContributionTypeCreate(ContributionTypeBase):
    pass

class ContributionTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

class ContributionBase(BaseModel):
    member_id: str
    contribution_type_id: Optional[str] = None
    amount: Decimal = Field(..., gt=0)
    due_date: Optional[date] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class ContributionCreate(ContributionBase):
    pass

class ContributionResponse(ContributionBase):
    id: str
    paid_amount: Decimal
    balance: Decimal
    status: str
    receipt_number: Optional[str]
    member_name: str
    contribution_type_name: Optional[str]
    recorded_at: datetime
    
    class Config:
        from_attributes = True

class ContributionCampaignBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    contribution_type_id: str
    target_amount: Decimal = Field(..., gt=0)
    start_date: date
    end_date: Optional[date] = None

class ContributionCampaignCreate(ContributionCampaignBase):
    pass

class ContributionCampaignResponse(ContributionCampaignBase):
    id: str
    collected_amount: Decimal
    progress: float
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ContributionTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    category: Optional[str] = None
