from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.core.exceptions import NotFoundException, AlreadyExistsException
from app.models.member import Member
from app.models.group import Group
from app.core.security import hash_password

class MemberService:
    @staticmethod
    def get_members(db: Session, village_id: str, skip: int = 0, limit: int = 20,
                    search: Optional[str] = None, role: Optional[str] = None,
                    group_id: Optional[str] = None) -> List[Dict]:
        from app.models.group import Group
        from sqlalchemy.orm import joinedload
        
        query = db.query(Member).options(joinedload(Member.group)).filter(
            Member.village_id == village_id,
            Member.deleted_at.is_(None)
        )
        
        if search:
            query = query.filter(
                Member.first_name.ilike(f"%{search}%") |
                Member.last_name.ilike(f"%{search}%") |
                Member.phone.ilike(f"%{search}%")
            )
        
        if role:
            query = query.filter(Member.role == role)
        
        if group_id:
            query = query.filter(Member.group_id == group_id)
        
        members = query.order_by(Member.created_at.desc()).offset(skip).limit(limit).all()
        
        result = []
        for m in members:
            # No extra query — relationship is already loaded
            group_name = m.group.name if m.group else None
            
            result.append({
                "id": str(m.id),
                "first_name": m.first_name,
                "last_name": m.last_name,
                "phone": m.phone,
                "email": m.email,
                "role": m.role,
                "custom_role": m.custom_role,
                "is_active": m.is_active,
                "full_name": m.full_name,
                "group_name": group_name,
                "group_id": str(m.group_id) if m.group_id else None,
                "member_number": m.member_number,
                "gender": m.gender,
                "age_category": m.age_category,
                "custom_field": m.custom_field
            })
        
        return result
    
    @staticmethod
    def get_member(db: Session, village_id: str, member_id: str) -> Dict:
        member = db.query(Member).filter(
            Member.id == member_id,
            Member.village_id == village_id,
            Member.deleted_at.is_(None)
        ).first()
        
        if not member:
            member = db.query(Member).filter(
                Member.member_number == member_id,
                Member.village_id == village_id,
                Member.deleted_at.is_(None)
            ).first()
        
        if not member:
            raise NotFoundException("Member")
        
        group_name = None
        if member.group_id:
            group = db.query(Group).filter(Group.id == member.group_id).first()
            if group:
                group_name = group.name
        
        return {
            "id": str(member.id),
            "first_name": member.first_name,
            "last_name": member.last_name,
            "phone": member.phone,
            "email": member.email,
            "role": member.role,
            "custom_role": member.custom_role,
            "is_active": member.is_active,
            "full_name": member.full_name,
            "group_name": group_name,
            "group_id": str(member.group_id) if member.group_id else None,
            "member_number": member.member_number,
            "gender": member.gender,
            "age_category": member.age_category,
            "custom_field": member.custom_field,
            "date_of_birth": member.date_of_birth,
            "created_at": member.created_at
        }
    
    @staticmethod
    def create_member(db: Session, village_id: str, data: dict, current_user_id: str) -> Dict:

        # Check phone uniqueness only if phone is provided and not empty
        phone = data.get('phone')
        if phone and phone.strip():
            existing = db.query(Member).filter(
                Member.phone == phone,
                Member.deleted_at.is_(None)
            ).first()
            if existing:
                raise AlreadyExistsException("Phone number")
        
        if data.get('member_number'):
            existing = db.query(Member).filter(
                Member.member_number == data['member_number'],
                Member.deleted_at.is_(None)
            ).first()
            if existing:
                raise AlreadyExistsException("Member number")
        
        if data.get('group_id'):
            group = db.query(Group).filter(
                Group.id == data['group_id'],
                Group.village_id == village_id
            ).first()
            if not group:
                raise NotFoundException("Group")
        
            # Auto-generate member_number if not provided
        member_number = data.get('member_number')
        if not member_number:
            # Generate a unique member number
            import uuid
            member_number = f"M-{uuid.uuid4().hex[:8].upper()}"
        
        member = Member(
            village_id=village_id,
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data['phone'],
            email=data.get('email'),
            role=data.get('role', 'member'),
            custom_field=data.get('custom_field'),
            gender=data.get('gender'),
            group_id=data.get('group_id'),
            member_number=member_number,
            password_hash="",  # empty until member sets via invite email
        )
        
        # Generate invite token
        import secrets
        from datetime import datetime, timedelta
        invite_token = secrets.token_urlsafe(32)
        member.reset_token = invite_token
        member.reset_token_expires = datetime.utcnow() + timedelta(days=7)

        db.add(member)
        db.commit()
        db.refresh(member)

        # Build the invite link (used for email or SMS)
        from app.core.config import settings
        from app.models.village import Village
        import urllib.parse
        import logging
        log = logging.getLogger(__name__)

        village = db.query(Village).filter(Village.id == village_id).first()
        village_name = village.name if village else "MtaaLink"

        inviter = db.query(Member).filter(Member.id == current_user_id).first()
        invited_by = inviter.full_name if inviter else "an admin"

        # Email link includes email so we can look up the member by both
        if member.email:
            set_password_link = (
                f"{settings.APP_URL}/reset-password"
                f"?token={invite_token}"
                f"&email={urllib.parse.quote(member.email)}"
            )
        else:
            # No email — link only has the token
            set_password_link = (
                f"{settings.APP_URL}/reset-password"
                f"?token={invite_token}"
            )

        invite_channel = "none"

        # Try email first
        if member.email:
            try:
                from app.services.email_service import send_invite_email
                ok = send_invite_email(
                    to_email=member.email,
                    set_password_link=set_password_link,
                    first_name=member.first_name,
                    village_name=village_name,
                    invited_by=invited_by,
                )
                if ok:
                    invite_channel = "email"
                else:
                    log.warning(f"Email invite failed for {member.email}")
            except Exception as e:
                log.error(f"Email invite error for {member.email}: {e}")

        # Fall back to SMS if email missing or failed
        if invite_channel == "none" and member.phone:
            try:
                from app.services.sms_service import SMSService
                sms_message = (
                    f"{village_name}: Hi {member.first_name}, "
                    f"{invited_by} invited you to join. "
                    f"Set your password: {set_password_link} "
                    f"(expires in 7 days)"
                )
                result = SMSService.send_sms(
                    to_phone=member.phone,
                    message=sms_message,
                    sms_type="transactional",
                )
                if result.get("success"):
                    invite_channel = "sms"
                else:
                    log.warning(f"SMS invite failed for {member.phone}: {result.get('error')}")
            except Exception as e:
                log.error(f"SMS invite error for {member.phone}: {e}")

        # Build response message
        msg = f"Member {member.full_name} created."
        if invite_channel == "email":
            msg += " Invitation email sent."
        elif invite_channel == "sms":
            msg += " Invitation sent via SMS."
        else:
            msg += " Warning: could not deliver invite (check email/SMS settings)."

        return {
            "id": str(member.id),
            "message": msg,
            "invite_channel": invite_channel,
        }
    
    @staticmethod
    def update_member_by_id(db: Session, member_id: str, data: dict) -> Dict:
        member = db.query(Member).filter(
            Member.id == member_id,
            Member.deleted_at.is_(None)
        ).first()
        
        if not member:
            raise NotFoundException("Member")
        
        # Validate group if provided (but allow null)
        if data.get('group_id'):
            group = db.query(Group).filter(
                Group.id == data['group_id']
            ).first()
            if not group:
                raise NotFoundException("Group")
        
        # Update fields - allow setting to None
        # Prevent changing admin role - with better error handling
        if member.role == 'admin' and data.get('role') and data.get('role') != 'admin':
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Cannot change admin role")
        # If role is not provided, keep the current role
        if 'role' not in data:
            data['role'] = member.role
        
        updatable_fields = [
            'first_name', 'last_name', 'phone', 'email', 'role', 
            'gender', 'age_category', 'group_id', 'member_number', 'is_active', 'custom_field'
        ]
        
        for field in updatable_fields:
            if field in data:  # Allow None values
                setattr(member, field, data[field])
        
        db.commit()
        db.refresh(member)
        
        return {
            "message": f"Member {member.full_name} updated",
            "member": {
                "id": str(member.id),
                "full_name": member.full_name,
                "group_id": str(member.group_id) if member.group_id else None
            }
        }
    
    @staticmethod
    def delete_member(db: Session, village_id: str, member_id: str) -> Dict:
        member = db.query(Member).filter(
            Member.id == member_id,
            Member.village_id == village_id
        ).first()
        
        if not member:
            raise NotFoundException("Member")
        
        member.soft_delete()
        member.is_active = False
        db.commit()
        
        return {"message": f"Member {member.full_name} deleted"}
    
    @staticmethod
    def assign_group(db: Session, village_id: str, member_id: str, group_id: str) -> Dict:
        member = db.query(Member).filter(
            Member.id == member_id,
            Member.village_id == village_id,
            Member.deleted_at.is_(None)
        ).first()
        
        if not member:
            raise NotFoundException("Member")
        
        group = db.query(Group).filter(
            Group.id == group_id,
            Group.village_id == village_id,
            Group.deleted_at.is_(None)
        ).first()
        
        if not group:
            raise NotFoundException("Group")
        
        member.group_id = group_id
        db.commit()
        
        return {"message": f"Member {member.full_name} assigned to {group.name}"}
    
    @staticmethod
    def remove_group(db: Session, village_id: str, member_id: str) -> Dict:
        member = db.query(Member).filter(
            Member.id == member_id,
            Member.village_id == village_id,
            Member.deleted_at.is_(None)
        ).first()
        
        if not member:
            raise NotFoundException("Member")
        
        member.group_id = None
        db.commit()
        
        return {"message": f"Member {member.full_name} removed from group"}
