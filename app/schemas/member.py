from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date, datetime

class MemberBase(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., pattern=r'^0[17]\d{8}$')
    email: Optional[EmailStr] = None
    member_number: str = Field(..., min_length=2, max_length=50)  # Required, unique
    id_number: Optional[str] = Field(None, max_length=50)
    role: str = "member"
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    group_id: Optional[str] = None

class MemberCreate(MemberBase):
    password: Optional[str] = Field(None, min_length=8)

class MemberUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, pattern=r'^0[17]\d{8}$')
    email: Optional[EmailStr] = None
    member_number: Optional[str] = Field(None, min_length=2, max_length=50)
    id_number: Optional[str] = Field(None, max_length=50)
    role: Optional[str] = None
    gender: Optional[str] = None
    age_category: Optional[str] = None
    date_of_birth: Optional[date] = None
    is_active: Optional[bool] = None
    group_id: Optional[str] = None

class MemberResponse(MemberBase):
    id: str
    village_id: str
    is_active: bool
    is_verified: bool
    full_name: str
    group_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class MemberUpdateWithGroup(MemberUpdate):
    group_id: Optional[str] = None

class MemberUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, pattern=r'^0[17]\d{8}$')
    email: Optional[EmailStr] = None
    member_number: Optional[str] = Field(None, min_length=2, max_length=50)
    id_number: Optional[str] = Field(None, max_length=50)
    role: Optional[str] = None
    gender: Optional[str] = None
    age_category: Optional[str] = None
    date_of_birth: Optional[date] = None
    is_active: Optional[bool] = None
    group_id: Optional[str] = None  # Add this line
