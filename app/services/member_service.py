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
        query = db.query(Member).filter(
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
        
        members = query.offset(skip).limit(limit).all()
        
        result = []
        for m in members:
            group_name = None
            if m.group_id:
                group = db.query(Group).filter(Group.id == m.group_id).first()
                if group:
                    group_name = group.name
            
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
                "age_category": m.age_category
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
            "date_of_birth": member.date_of_birth,
            "created_at": member.created_at
        }
    
    @staticmethod
    def create_member(db: Session, village_id: str, data: dict, current_user_id: str) -> Dict:
        existing = db.query(Member).filter(
            Member.phone == data['phone'],
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
        
        member = Member(
            village_id=village_id,
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data['phone'],
            email=data.get('email'),
            role=data.get('role', 'member'),
            gender=data.get('gender'),
            group_id=data.get('group_id'),
            member_number=data.get('member_number'),
            password_hash=hash_password(data.get('password', 'default123')) if data.get('password') else ""
        )
        
        db.add(member)
        db.commit()
        db.refresh(member)
        
        return {"id": str(member.id), "message": f"Member {member.full_name} created"}
    
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
        updatable_fields = [
            'first_name', 'last_name', 'phone', 'email', 'role', 
            'gender', 'group_id', 'member_number', 'is_active'
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
