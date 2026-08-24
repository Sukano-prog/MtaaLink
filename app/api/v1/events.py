from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.core.exceptions import AppException
from app.schemas.event import EventCreate, EventUpdate, EventAttendanceCreate, EventContributionCreate
from app.services.event_service import EventService
from app.models.member import Member

router = APIRouter(prefix="/api/v1/events", tags=["Events"])

@router.get("/")
async def get_events(
    event_type: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return EventService.get_events(db, current_user.village_id, event_type, search)
    except AppException as e:
        raise e

@router.get("/{event_id}")
async def get_event(
    event_id: str,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return EventService.get_event(db, current_user.village_id, event_id)
    except AppException as e:
        raise e

@router.post("/")
async def create_event(
    data: EventCreate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return EventService.create_event(db, current_user.village_id, data.dict(), current_user.id)
    except AppException as e:
        raise e

@router.put("/{event_id}")
async def update_event(
    event_id: str,
    data: EventUpdate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return EventService.update_event(db, current_user.village_id, event_id, data.dict())
    except AppException as e:
        raise e

@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return EventService.delete_event(db, current_user.village_id, event_id)
    except AppException as e:
        raise e

@router.post("/{event_id}/attendance/{member_id}")
async def add_attendance(
    event_id: str,
    member_id: str,
    role: Optional[str] = None,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return EventService.add_attendance(db, event_id, member_id, role)
    except AppException as e:
        raise e

@router.post("/{event_id}/contributions")
async def add_contribution(
    event_id: str,
    data: EventContributionCreate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        # Add recorded_by
        data_dict = data.dict()
        data_dict['recorded_by'] = current_user.id
        return EventService.add_contribution(db, event_id, data_dict)
    except AppException as e:
        raise e
