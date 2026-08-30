from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import secrets
import bcrypt
import jwt
import os
import logging

from app.models.village import Village
from app.models.member import Member
from app.models.audit_log import AuditLog
from app.core.config import settings

logger = logging.getLogger(__name__)

class AuthService:
    
    @staticmethod
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    @staticmethod
    def create_access_token(data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        try:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except jwt.PyJWTError:
            return None
    
    @staticmethod
    def register(db: Session, data: dict) -> Dict[str, Any]:
        # Check if email exists
        existing = db.query(Village).filter(Village.admin_email == data['email']).first()
        if existing:
            return {"success": False, "error": "Email already registered"}
        
        # Check if phone exists
        existing_phone = db.query(Member).filter(Member.phone == data['phone']).first()
        if existing_phone:
            return {"success": False, "error": "Phone already registered"}
        
        # Generate verification token
        raw_token = secrets.token_urlsafe(32)
        
        # Create village (has verification_token)
        village = Village(
            name=data['organization_name'],
            admin_email=data['email'],
            admin_phone=data['phone'],
            is_verified=False,
            email_verified=False,
            verification_token=raw_token,
            verification_token_expires=datetime.utcnow() + timedelta(days=7),
            trial_ends=datetime.utcnow() + timedelta(days=30)
        )
        db.add(village)
        db.flush()
        
        # Create admin member (NO verification_token field!)
        admin = Member(
            village_id=village.id,
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data['phone'],
            email=data['email'],
            role="admin",
            is_active=True,
            is_verified=False,  # This field exists
            password_hash=AuthService.hash_password(data['password']),
            member_number=f"ADMIN-{village.id[:8]}"
        )
        db.add(admin)
        db.flush()
        
        # Create audit log
        try:
            audit = AuditLog(
                village_id=village.id,
                member_id=admin.id,
                action="REGISTER",
                table_name="villages",
                record_id=village.id,
                new_data={
                    "email": data['email'],
                    "organization": data['organization_name'],
                    "first_name": data['first_name'],
                    "last_name": data['last_name'],
                    "phone": data['phone']
                }
            )
            db.add(audit)
        except Exception as e:
            logger.warning(f"Could not create audit log: {e}")
        
        db.commit()
        db.refresh(admin)
        
        return {
            "success": True,
            "village_id": str(village.id),
            "admin_id": str(admin.id),
            "verification_token": raw_token
        }
    
    @staticmethod
    def verify_email(db: Session, email: str, token: str) -> Dict[str, Any]:
        """Verify email - checks ONLY Village table (which has verification_token)"""
        # Find village with this token
        village = db.query(Village).filter(
            Village.admin_email == email,
            Village.verification_token == token,
            Village.is_verified == False
        ).first()
        
        if not village:
            # Check if already verified
            village = db.query(Village).filter(
                Village.admin_email == email,
                Village.is_verified == True
            ).first()
            if village:
                return {"success": True, "message": "Email already verified"}
            return {"success": False, "error": "Invalid or expired verification link"}
        
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
        
        db.commit()
        
        return {"success": True, "message": "Email verified successfully"}
    
    @staticmethod
    def login(db: Session, email: str, password: str) -> Dict[str, Any]:
        # Find member
        member = db.query(Member).filter(Member.email == email).first()
        
        if not member:
            return {"success": False, "error": "Invalid email or password"}
        
        # Check if village is verified
        village = db.query(Village).filter(Village.id == member.village_id).first()
        if not village or not village.is_verified:
            return {"success": False, "error": "Please verify your email before logging in"}
        
        # Verify password
        if not AuthService.verify_password(password, member.password_hash):
            return {"success": False, "error": "Invalid email or password"}
        
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
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "village_id": str(village.id) if village else None,
            "organization_id": str(village.id) if village else None,
            "organization_name": village.name if village else None,
            "village_name": village.name if village else None,
            "role": member.role,
            "member_id": str(member.id)
        }
