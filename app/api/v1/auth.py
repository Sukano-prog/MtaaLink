from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.exceptions import AppException
from app.schemas.auth import LoginRequest, RegisterRequest, LoginResponse, ChangePasswordRequest, UserResponse
from app.services.auth_service import AuthService
from app.models.member import Member
from app.models.village import Village

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/register")
async def register(request: Request, data: RegisterRequest, db: Session = Depends(get_db)):
    try:
        result = AuthService.register(db, data.dict())
        return result
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(str(e))


@router.get("/verify-email")
async def verify_email(
    token: str,
    email: str,
    db: Session = Depends(get_db)
):
    """Verify email address using token"""
    from datetime import datetime
    
    print(f"🔍 Verifying email: {email}")
    print(f"🔍 Token received: {token}")
    
    # Find village with this token (raw token, no hashing)
    village = db.query(Village).filter(
        Village.admin_email == email,
        Village.verification_token == token,
        Village.deleted_at.is_(None)
    ).first()
    
    if not village:
        print(f"❌ No village found with token: {token}")
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    
    print(f"🔍 Village found: {village.name}")
    print(f"🔍 Stored token: {village.verification_token}")
    print(f"🔍 Token match: {village.verification_token == token}")
    
    # Check if expired
    if village.verification_token_expires and village.verification_token_expires < datetime.utcnow():
        print(f"❌ Token expired at: {village.verification_token_expires}")
        raise HTTPException(status_code=400, detail="Verification link has expired")
    
    # Mark as verified
    village.email_verified = True
    village.is_verified = True
    village.verification_token = None
    village.verification_token_expires = None
    
    db.commit()
    
    print(f"✅ Email verified for: {email}")
    return {"message": "Email verified successfully! You can now login."}

@router.post("/login", response_model=LoginResponse)
async def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    try:
        return AuthService.login(db, data.email, data.password)
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(str(e))

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.village import Village
    village = db.query(Village).filter(Village.id == current_user.village_id).first()
    org_name = village.name if village else "MtaaLink"
    
    return {
        "id": str(current_user.id),
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "village_id": str(current_user.village_id),
        "organization_id": str(current_user.village_id),
        "full_name": current_user.full_name,
        "organization_name": org_name
    }

@router.post("/logout")
async def logout(current_user: Member = Depends(get_current_user)):
    return {"message": "Logged out successfully"}

@router.post("/change-password")
async def change_password(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user)
):
    """Change user password"""
    try:
        data = await request.json()
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        if not old_password or not new_password:
            raise AppException("Old and new password required")
        
        if len(new_password) < 8:
            raise AppException("New password must be at least 8 characters")
        
        # Import security functions
        from app.core.security import verify_password, hash_password
        
        # Verify old password
        if not verify_password(old_password, current_user.password_hash):
            raise AppException("Incorrect current password")
        
        # Update password
        current_user.password_hash = hash_password(new_password)
        db.commit()
        
        return {"message": "Password changed successfully"}
        
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(str(e))
