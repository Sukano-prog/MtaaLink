from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.core.exceptions import AppException
from app.models.member import Member
from app.models.group import Group, GroupMember
from app.schemas.group import GroupCreate, GroupUpdate
from datetime import datetime

router = APIRouter(tags=["Groups"])

@router.get("/api/v1/groups")
@router.get("/api/v1/groups/")
async def get_groups(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        groups = db.query(Group).filter(
            Group.village_id == current_user.village_id,
            Group.deleted_at.is_(None)
        ).all()
        
        result = []
        for g in groups:
            # Get members from BOTH sources
            junction_members = db.query(GroupMember).filter(
                GroupMember.group_id == g.id,
                GroupMember.deleted_at.is_(None)
            ).all()
            junction_member_ids = [jm.member_id for jm in junction_members]
            
            direct_members = db.query(Member).filter(
                Member.group_id == g.id,
                Member.deleted_at.is_(None)
            ).all()
            direct_member_ids = [m.id for m in direct_members]
            
            all_member_ids = list(set(junction_member_ids + direct_member_ids))
            
            members_list = []
            for member_id in all_member_ids:
                member = db.query(Member).filter(
                    Member.id == member_id,
                    Member.deleted_at.is_(None)
                ).first()
                if member:
                    members_list.append({
                        "id": str(member.id),
                        "name": member.full_name,
                        "phone": member.phone,
                        "role": member.role
                    })
            
            result.append({
                "id": str(g.id),
                "name": g.name,
                "description": g.description,
                "is_default": g.is_default,
                "member_count": len(members_list),
                "members": members_list
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/v1/groups/{group_id}")
@router.get("/api/v1/groups/{group_id}/")
async def get_group(
    group_id: str,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        group = db.query(Group).filter(
            Group.id == group_id,
            Group.village_id == current_user.village_id,
            Group.deleted_at.is_(None)
        ).first()
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        junction_members = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.deleted_at.is_(None)
        ).all()
        junction_member_ids = [jm.member_id for jm in junction_members]
        
        direct_members = db.query(Member).filter(
            Member.group_id == group_id,
            Member.deleted_at.is_(None)
        ).all()
        direct_member_ids = [m.id for m in direct_members]
        
        all_member_ids = list(set(junction_member_ids + direct_member_ids))
        
        members = []
        for member_id in all_member_ids:
            member = db.query(Member).filter(
                Member.id == member_id,
                Member.deleted_at.is_(None)
            ).first()
            if member:
                members.append({
                    "id": str(member.id),
                    "name": member.full_name,
                    "phone": member.phone,
                    "role": member.role
                })
        
        return {
            "id": str(group.id),
            "name": group.name,
            "description": group.description,
            "is_default": group.is_default,
            "member_count": len(members),
            "members": members
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/v1/groups")
@router.post("/api/v1/groups/")
async def create_group(
    data: GroupCreate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        group = Group(
            village_id=current_user.village_id,
            name=data.name,
            description=data.description,
            created_by=current_user.id
        )
        
        db.add(group)
        db.commit()
        db.refresh(group)
        
        return {"id": str(group.id), "message": f"Group '{group.name}' created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/api/v1/groups/{group_id}")
@router.put("/api/v1/groups/{group_id}/")
async def update_group(
    group_id: str,
    data: GroupUpdate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        group = db.query(Group).filter(
            Group.id == group_id,
            Group.village_id == current_user.village_id,
            Group.deleted_at.is_(None)
        ).first()
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        for field, value in data.dict(exclude_unset=True).items():
            setattr(group, field, value)
        
        db.commit()
        db.refresh(group)
        
        return {"message": f"Group '{group.name}' updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/v1/groups/{group_id}")
@router.delete("/api/v1/groups/{group_id}/")
async def delete_group(
    group_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        group = db.query(Group).filter(
            Group.id == group_id,
            Group.village_id == current_user.village_id,
            Group.deleted_at.is_(None)
        ).first()
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        group.deleted_at = datetime.utcnow()
        db.commit()
        
        return {"message": f"Group '{group.name}' deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/v1/groups/{group_id}/members/{member_id}")
@router.post("/api/v1/groups/{group_id}/members/{member_id}/")
async def add_member_to_group(
    group_id: str,
    member_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        # Check if group exists
        group = db.query(Group).filter(
            Group.id == group_id,
            Group.village_id == current_user.village_id,
            Group.deleted_at.is_(None)
        ).first()
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Find member by id or member_number
        member = db.query(Member).filter(
            Member.id == member_id,
            Member.village_id == current_user.village_id,
            Member.deleted_at.is_(None)
        ).first()
        
        if not member:
            member = db.query(Member).filter(
                Member.member_number == member_id,
                Member.village_id == current_user.village_id,
                Member.deleted_at.is_(None)
            ).first()
        
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        # Check if already in group (including soft-deleted)
        existing = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.member_id == member.id
        ).first()
        
        if existing:
            # If soft-deleted, reactivate it
            if existing.deleted_at is not None:
                existing.deleted_at = None
                existing.updated_at = datetime.utcnow()
                db.commit()
                return {"message": f"Member '{member.full_name}' reactivated in group '{group.name}'"}
            else:
                raise HTTPException(status_code=400, detail="Member already in this group")
        
        # Add new record
        gm = GroupMember(group_id=group_id, member_id=member.id)
        db.add(gm)
        
        # Also update the member's group_id
        member.group_id = group_id
        db.commit()
        
        return {"message": f"Member '{member.full_name}' added to group '{group.name}'"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/v1/groups/{group_id}/members/{member_id}")
@router.delete("/api/v1/groups/{group_id}/members/{member_id}/")
async def remove_member_from_group(
    group_id: str,
    member_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        # Find member by id or member_number
        member = db.query(Member).filter(
            Member.id == member_id,
            Member.village_id == current_user.village_id,
            Member.deleted_at.is_(None)
        ).first()
        
        if not member:
            member = db.query(Member).filter(
                Member.member_number == member_id,
                Member.village_id == current_user.village_id,
                Member.deleted_at.is_(None)
            ).first()
        
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        # Remove from junction table
        gm = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.member_id == member.id,
            GroupMember.deleted_at.is_(None)
        ).first()
        
        if gm:
            gm.deleted_at = datetime.utcnow()
        
        # Remove group_id from member
        member.group_id = None
        db.commit()
        
        return {"message": f"Member '{member.full_name}' removed from group"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
