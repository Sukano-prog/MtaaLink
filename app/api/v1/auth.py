from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.exceptions import AppException
from app.schemas.auth import LoginRequest, RegisterRequest, LoginResponse, ChangePasswordRequest, UserResponse
from app.services.auth_service import AuthService
from app.services.email_service import send_verification_email
from app.models.member import Member
from app.models.village import Village
from app.core.config import settings
import urllib.parse

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])




@router.post("/forgot-password")
async def forgot_password(email: str, db: Session = Depends(get_db)):
    """Send password reset link to user's email"""
    try:
        import secrets
        from datetime import datetime, timedelta
        from app.services.email_service import send_password_reset_email
        
        member = db.query(Member).filter(Member.email == email).first()
        if not member:
            return {"message": "If your email is registered, you will receive a reset link"}
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        member.reset_token = reset_token
        member.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        
        # Send email
        reset_link = f"{settings.APP_URL}/reset-password?token={reset_token}&email={urllib.parse.quote(email)}"
        send_password_reset_email(email, reset_link)
        
        return {"message": "Password reset link sent to your email"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reset-password")
async def verify_reset_token(token: str, email: str, db: Session = Depends(get_db)):
    """Verify reset token and show reset form"""
    try:
        from datetime import datetime
        
        member = db.query(Member).filter(
            Member.email == email,
            Member.reset_token == token
        ).first()
        
        if not member:
            raise HTTPException(status_code=400, detail="Invalid or expired reset link")
        
        if member.reset_token_expires and member.reset_token_expires < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Reset link has expired")
        
        # Return success - frontend will show password reset form
        return {"message": "Token valid", "email": email}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-password")
async def reset_password(request: Request, db: Session = Depends(get_db)):
    """Reset password with new password"""
    try:
        from datetime import datetime
        from app.core.security import hash_password
        
        data = await request.json()
        email = data.get('email')
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not email or not token or not new_password:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        member = db.query(Member).filter(
            Member.email == email,
            Member.reset_token == token
        ).first()
        
        if not member:
            raise HTTPException(status_code=400, detail="Invalid or expired reset link")
        
        if member.reset_token_expires and member.reset_token_expires < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Reset link has expired")
        
        # Update password
        member.password_hash = hash_password(new_password)
        member.reset_token = None
        member.reset_token_expires = None
        db.commit()
        
        return {"message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/register")
async def register(request: Request, data: RegisterRequest, db: Session = Depends(get_db)):
    try:
        result = AuthService.register(db, data.dict())
        
        # Send verification email
        token = result.get('verification_token')
        if token:
            verification_link = f"{settings.APP_URL}/verify?token={token}&email={urllib.parse.quote(data.email)}"
            send_verification_email(data.email, verification_link)
        
        return result
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(str(e))


@router.get("/verify-email")
async def verify_email(token: str, email: str, db: Session = Depends(get_db)):
    """Verify user's email address"""
    try:
        village = db.query(Village).filter(
            Village.admin_email == email,
            Village.verification_token == token
        ).first()
        
        if not village:
            raise HTTPException(status_code=400, detail="Invalid or expired verification link")
        
        if village.is_verified:
            return {"message": "Email already verified"}
        
        # Check if token expired
        if village.verification_token_expires and village.verification_token_expires < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Verification link has expired")
        
        # Mark as verified
        village.is_verified = True
        village.verification_token = None
        village.verification_token_expires = None
        db.commit()
        
        # Also update member
        member = db.query(Member).filter(Member.email == email).first()
        if member:
            member.is_verified = True
            db.commit()
        
        return {"message": "Email verified successfully. You can now log in."}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        
        from app.core.security import verify_password, hash_password
        
        if not verify_password(old_password, current_user.password_hash):
            raise AppException("Incorrect current password")
        
        current_user.password_hash = hash_password(new_password)
        db.commit()
        
        return {"message": "Password changed successfully"}
        
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(str(e))
