from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.core.exceptions import AppException, AlreadyExistsException, NotFoundException
from app.schemas.member import MemberCreate, MemberUpdate, MemberResponse
from app.services.member_service import MemberService
from app.models.member import Member

router = APIRouter(tags=["Members"])

@router.get("/api/v1/members")
@router.get("/api/v1/members/")
async def get_members(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    group_id: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return MemberService.get_members(
            db, current_user.village_id, skip, limit, search, role, group_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching members")

@router.get("/api/v1/members/{member_id}")
@router.get("/api/v1/members/{member_id}/")
async def get_member(
    member_id: str,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return MemberService.get_member(db, current_user.village_id, member_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail="Member not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching the member")

@router.post("/api/v1/members")
@router.post("/api/v1/members/")
async def create_member(
    data: MemberCreate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return MemberService.create_member(db, current_user.village_id, data.dict(), current_user.id)
    except AlreadyExistsException as e:
        raise HTTPException(status_code=409, detail=e.detail)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.detail)
    except IntegrityError as e:
        if "phone" in str(e).lower():
            raise HTTPException(status_code=409, detail="Phone number already exists. Please use a different phone number.")
        if "member_number" in str(e).lower():
            raise HTTPException(status_code=409, detail="Member ID already exists. Please use a different ID.")
        raise HTTPException(status_code=409, detail="A member with this information already exists.")
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while creating the member")

@router.put("/api/v1/members/{member_id}")
@router.put("/api/v1/members/{member_id}/")
async def update_member(
    member_id: str,
    data: MemberUpdate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        # First try to find by id, then by member_number
        member = db.query(Member).filter(
            Member.id == member_id,
            Member.village_id == current_user.village_id,
            Member.deleted_at.is_(None)
        ).first()
        
        if not member:
            # Try by member_number
            member = db.query(Member).filter(
                Member.member_number == member_id,
                Member.village_id == current_user.village_id,
                Member.deleted_at.is_(None)
            ).first()
        
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        result = MemberService.update_member_by_id(db, member.id, data.dict(exclude_unset=True))
        return result
        
    except AlreadyExistsException as e:
        raise HTTPException(status_code=409, detail=e.detail)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.detail)
    except IntegrityError as e:
        error_msg = str(e).lower()
        if "phone" in error_msg:
            raise HTTPException(status_code=409, detail="This phone number is already registered to another member. Please use a different phone number.")
        if "member_number" in error_msg or "member number" in error_msg:
            raise HTTPException(status_code=409, detail="This Member ID is already assigned to another member. Please use a different Member ID.")
        raise HTTPException(status_code=409, detail="A member with this information already exists.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while updating the member")

@router.delete("/api/v1/members/{member_id}")
@router.delete("/api/v1/members/{member_id}/")
async def delete_member(
    member_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return MemberService.delete_member(db, current_user.village_id, member_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail="Member not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while deleting the member")

@router.post("/api/v1/members/{member_id}/assign-group")
@router.post("/api/v1/members/{member_id}/assign-group/")
async def assign_group_to_member(
    member_id: str,
    group_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return MemberService.assign_group(db, current_user.village_id, member_id, group_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while assigning the group")

@router.delete("/api/v1/members/{member_id}/remove-group")
@router.delete("/api/v1/members/{member_id}/remove-group/")
async def remove_member_from_group(
    member_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return MemberService.remove_group(db, current_user.village_id, member_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while removing the member from the group")
