from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import secrets

from app.core.security import hash_password, verify_password, create_token
from app.core.exceptions import UnauthorizedException, AlreadyExistsException
from app.models.village import Village
from app.models.member import Member
from app.models.audit_log import AuditLog

class AuthService:
    @staticmethod
    def register(db: Session, data: dict) -> Dict[str, Any]:
        # Check if email exists
        existing = db.query(Village).filter(Village.admin_email == data['email']).first()
        if existing:
            raise AlreadyExistsException("Email or phone")
        
        # Check if phone exists
        existing_phone = db.query(Member).filter(Member.phone == data['phone']).first()
        if existing_phone:
            raise AlreadyExistsException("Email or phone")
        
        # Generate verification token
        verification_token = secrets.token_urlsafe(32)
        
        # Create organization
        village = Village(
            name=data['organization_name'],
            admin_email=data['email'],
            admin_phone=data['phone'],
            is_verified=False,
            verification_token=verification_token,
            verification_token_expires=datetime.utcnow() + timedelta(hours=24),
            trial_ends=datetime.utcnow() + timedelta(days=30)
        )
        db.add(village)
        db.flush()
        
        # Create admin member
        admin = Member(
            village_id=village.id,
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data['phone'],
            email=data['email'],
            role="admin",
            is_active=True,
            is_verified=False,
            password_hash=hash_password(data['password']),
            member_number=f"ADMIN-{village.id[:8]}"
        )
        db.add(admin)
        db.commit()
        
        # Audit log
        audit = AuditLog(
            village_id=village.id,
            member_id=admin.id,
            action="REGISTER",
            table_name="villages",
            record_id=village.id,
            new_data={"email": data['email'], "village": data['organization_name']}
        )
        db.add(audit)
        db.commit()
        
        return {
            "village_id": village.id,
            "admin_id": admin.id,
            "verification_token": verification_token,
            "message": "Registration successful. Please verify your email."
        }
    
    @staticmethod
    @staticmethod
    def login(db: Session, identifier: str, password: str) -> Dict[str, Any]:
        """Login with email OR phone number."""
        identifier = identifier.strip()

        # Determine if identifier is email or phone
        if "@" in identifier:
            member = db.query(Member).filter(
                Member.email == identifier.lower(),
                Member.deleted_at.is_(None),
            ).first()
        else:
            # Phone login — normalize to 0XXXXXXXXX
            phone = identifier.replace(" ", "").replace("-", "")
            if phone.startswith("+254"):
                phone = "0" + phone[4:]
            elif phone.startswith("254"):
                phone = "0" + phone[3:]
            member = db.query(Member).filter(
                Member.phone == phone,
                Member.deleted_at.is_(None),
            ).first()

        if not member:
            raise UnauthorizedException()

        if not member.password_hash:
            raise UnauthorizedException(
                "Your account has not been set up. Check your email for the invite link."
            )

        if not verify_password(password, member.password_hash):
            raise UnauthorizedException()

        if not member.is_active:
            raise UnauthorizedException("Account is deactivated")

        village = db.query(Village).filter(Village.id == member.village_id).first()
        if not village:
            raise UnauthorizedException("Village not found")

        # Only require village verification for admins
        ADMIN_ROLES = ["admin", "chairperson", "secretary", "elder", "treasurer"]
        if not village.is_verified and member.role in ADMIN_ROLES:
            raise UnauthorizedException("Please verify your email before logging in")

        token_data = {
            "sub": str(member.id),
            "village_id": str(member.village_id),
            "role": member.role,
        }
        token = create_token(token_data)

        return {
            "access_token": token,
            "token_type": "bearer",
            "village_id": str(village.id),
            "organization_id": str(village.id),
            "village_name": village.name,
            "organization_name": village.name,
            "role": member.role,
            "member_id": str(member.id),
        }

