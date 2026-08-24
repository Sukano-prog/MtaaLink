from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    village_name: str = Field(..., min_length=2)
    first_name: str = Field(..., min_length=2)
    last_name: str = Field(..., min_length=2)
    phone: str = Field(..., pattern=r'^0[17]\d{8}$')

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    village_id: str
    village_name: str
    role: str
    member_id: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    role: str
    village_id: str
    full_name: str
