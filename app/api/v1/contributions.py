from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.core.exceptions import AppException
from app.schemas.contribution import ContributionCreate, ContributionTypeCreate, ContributionTypeUpdate
from app.services.contribution_service import ContributionService
from app.models.member import Member

router = APIRouter(prefix="/api/v1/contributions", tags=["Contributions"])

@router.get("/")
async def get_contributions(
    member_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return ContributionService.get_contributions(db, current_user.village_id, member_id, status, search)
    except AppException as e:
        raise e

@router.post("/")
async def create_contribution(
    data: ContributionCreate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ContributionService.create_contribution(db, current_user.village_id, data.dict(), current_user.id)
    except AppException as e:
        raise e

@router.put("/{contribution_id}")
async def update_contribution(
    contribution_id: str,
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a contribution (e.g., record payment)"""
    try:
        return ContributionService.update_contribution(db, current_user.village_id, contribution_id, data)
    except AppException as e:
        raise e

@router.delete("/{contribution_id}")
async def delete_contribution(
    contribution_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a contribution"""
    try:
        return ContributionService.delete_contribution(db, current_user.village_id, contribution_id)
    except AppException as e:
        raise e

@router.get("/types")
async def get_contribution_types(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return ContributionService.get_types(db, current_user.village_id)
    except AppException as e:
        raise e

@router.post("/types")
async def create_contribution_type(
    data: ContributionTypeCreate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ContributionService.create_type(db, current_user.village_id, data.dict())
    except AppException as e:
        raise e

@router.put("/types/{type_id}")
async def update_contribution_type(
    type_id: str,
    data: ContributionTypeUpdate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ContributionService.update_type(db, current_user.village_id, type_id, data.dict())
    except AppException as e:
        raise e

@router.delete("/types/{type_id}")
async def delete_contribution_type(
    type_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ContributionService.delete_type(db, current_user.village_id, type_id)
    except AppException as e:
        raise e
