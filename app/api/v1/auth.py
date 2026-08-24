from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.exceptions import AppException
from app.schemas.auth import LoginRequest, RegisterRequest, LoginResponse, ChangePasswordRequest, UserResponse
from app.services.auth_service import AuthService
from app.models.member import Member

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

@router.post("/login", response_model=LoginResponse)
async def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    try:
        return AuthService.login(db, data.email, data.password)
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(str(e))

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: Member = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "village_id": str(current_user.village_id),
        "full_name": current_user.full_name
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
