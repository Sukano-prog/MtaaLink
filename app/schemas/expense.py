from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class ExpenseBase(BaseModel):
    description: str = Field(..., min_length=2)
    amount: Decimal = Field(..., gt=0)
    category: str
    expense_date: date
    payment_method: Optional[str] = None
    receipt_number: Optional[str] = None
    notes: Optional[str] = None
    project_id: Optional[str] = None
    event_id: Optional[str] = None
    meeting_id: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=2)
    amount: Optional[Decimal] = Field(None, gt=0)
    category: Optional[str] = None
    expense_date: Optional[date] = None
    payment_method: Optional[str] = None
    receipt_number: Optional[str] = None
    notes: Optional[str] = None
    project_id: Optional[str] = None
    event_id: Optional[str] = None
    meeting_id: Optional[str] = None
    approved_by: Optional[str] = None

class ExpenseResponse(ExpenseBase):
    id: str
    recorded_by_name: str
    approved_by_name: Optional[str]
    project_name: Optional[str]
    event_name: Optional[str]
    meeting_title: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ExpenseCategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None
    color: Optional[str] = None

class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

class ExpenseCategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    color: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
