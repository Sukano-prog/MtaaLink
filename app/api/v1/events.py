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

@router.post("/{event_id}/attendance/{member_id}/toggle")
async def toggle_attendance(
    event_id: str,
    member_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Toggle check-in status for a member"""
    try:
        from app.models.event import EventAttendance
        from datetime import datetime
        
        # Find the attendance record
        attendance = db.query(EventAttendance).filter(
            EventAttendance.event_id == event_id,
            EventAttendance.member_id == member_id,
            EventAttendance.deleted_at.is_(None)
        ).first()
        
        if not attendance:
            # If not found, create a new attendance record
            attendance = EventAttendance(
                event_id=event_id,
                member_id=member_id,
                attended=True,
                check_in_time=datetime.utcnow()
            )
            db.add(attendance)
            db.commit()
            return {"attended": True, "message": "Checked in"}
        
        # Toggle the status
        attendance.attended = not attendance.attended
        attendance.check_in_time = datetime.utcnow() if attendance.attended else None
        db.commit()
        
        return {"attended": attendance.attended, "message": "Checked in" if attendance.attended else "Check-in removed"}
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
