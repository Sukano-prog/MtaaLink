from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import os
import logging
import urllib.parse

from app.core.database import get_db
from app.models.member import Member
from app.models.village import Village
from app.schemas.auth import (
    RegisterRequest, LoginRequest, UserResponse, 
    LoginResponse, LoginResponse, ChangePasswordRequest
)
from app.services.auth_service import AuthService
from app.services.email_service import EmailService
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
async def register(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user with village"""
    try:
        result = AuthService.register(db, user_data.dict())
        if result["success"]:
            # Send verification email - FIXED: removed /api/v1 from path
            verification_link = f"{settings.APP_URL}/auth/verify-email?token={result['verification_token']}&email={urllib.parse.quote(user_data.email)}"
            email_result = EmailService.send_verification_email(
                to_email=user_data.email,
                verification_link=verification_link,
                organization_name=user_data.organization_name
            )
            
            if not email_result["success"]:
                logger.warning(f"Failed to send verification email: {email_result.get('error')}")
            
            return {
                "village_id": result["village_id"],
                "admin_id": result["admin_id"],
                "verification_token": result["verification_token"],
                "verification_link": verification_link,
                "message": "Registration successful. Please verify your email."
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/verify-email")
async def verify_email(
    token: str,
    email: str,
    db: Session = Depends(get_db)
):
    """Verify email address using token - checks Village table only"""
    try:
        print(f"🔍 Verifying email: {email}")
        print(f"🔍 Token received: {token}")
        
        # Check in Village table only (Member doesn't have verification_token)
        village = db.query(Village).filter(
            Village.admin_email == email,
            Village.verification_token == token,
            Village.is_verified == False
        ).first()
        
        if village:
            print(f"✅ Found village with token: {village.id}")
            # Mark village as verified
            village.is_verified = True
            village.email_verified = True
            village.verification_token = None
            
            # Also update the admin member's is_verified flag
            admin = db.query(Member).filter(
                Member.email == email,
                Member.role == 'admin'
            ).first()
            if admin:
                admin.is_verified = True
                print(f"✅ Updated member: {admin.id}")
            
            db.commit()
            return {"message": "Email verified successfully! You can now log in."}
        
        # Check if already verified
        existing_village = db.query(Village).filter(
            Village.admin_email == email,
            Village.is_verified == True
        ).first()
        if existing_village:
            return {"message": "Email already verified. You can now log in."}
        
        print(f"❌ No valid token found for {email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verification error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(e)}"
        )

@router.post("/login", response_model=LoginResponse)
async def login(
    user_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login user - MUST be verified first"""
    try:
        # Find member by email
        member = db.query(Member).filter(Member.email == user_data.email).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # CRITICAL: Check if email is verified
        if not member.is_verified:
            # Also check village as fallback
            village = db.query(Village).filter(Village.admin_email == user_data.email).first()
            if village and village.email_verified:
                # Sync verification status
                member.is_verified = True
                db.commit()
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Please verify your email before logging in. Check your inbox for the verification link."
                )
        
        # Verify password
        if not AuthService.verify_password(user_data.password, member.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Get village info
        village = db.query(Village).filter(Village.id == member.village_id).first()
        
        # Generate token
        token_data = {
            "sub": str(member.id),
            "village_id": str(village.id) if village else None,
            "role": member.role
        }
        access_token = AuthService.create_access_token(token_data)
        
        # Update last login
        member.last_login = datetime.utcnow()
        db.commit()
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "village_id": str(village.id) if village else None,
            "organization_id": str(village.id) if village else None,
            "organization_name": village.name if village else None,
            "village_name": village.name if village else None,
            "role": member.role,
            "member_id": str(member.id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/me")
async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get current user info"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    payload = AuthService.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    member_id = payload.get("sub")
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    village = db.query(Village).filter(Village.id == member.village_id).first()
    
    return {
        "id": member.id,
        "email": member.email,
        "first_name": member.first_name,
        "last_name": member.last_name,
        "phone": member.phone,
        "role": member.role,
        "village_id": str(village.id) if village else None,
        "village_name": village.name if village else None,
        "is_verified": member.is_verified
    }

@router.post("/logout")
async def logout(
    request: Request,
    response: Response
):
    """Logout user"""
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}

@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Change user password"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    payload = AuthService.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    member_id = payload.get("sub")
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not AuthService.verify_password(data.old_password, member.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid current password"
        )
    
    member.password_hash = AuthService.hash_password(data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
