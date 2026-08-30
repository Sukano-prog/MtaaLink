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

@router.post("/{event_id}/attendance")
async def add_attendance_with_visitor(
    event_id: str,
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Add attendance with visitor support"""
    try:
        from app.models.event import EventAttendance
        from datetime import datetime
        import uuid
        
        if data.get('is_visitor'):
            # Check if visitor already exists for this event
            existing = db.query(EventAttendance).filter(
                EventAttendance.event_id == event_id,
                EventAttendance.member_name == data.get('visitor_name'),
                EventAttendance.member_phone == data.get('visitor_phone'),
                EventAttendance.is_visitor == True,
                EventAttendance.deleted_at.is_(None)
            ).first()
            
            if existing:
                return {"message": "Visitor already checked in", "attended": existing.attended, "existing": True}
            
            # Create a temporary member or just track visitor
            attendance = EventAttendance(
                id=str(uuid.uuid4()),
                event_id=event_id,
                member_id=None,
                member_name=data.get('visitor_name', 'Visitor'),
                member_gender=data.get('visitor_gender'),
                member_age_category=data.get('visitor_age'),
                member_phone=data.get('visitor_phone'),
                attended=True,
                is_visitor=True,
                check_in_time=datetime.utcnow()
            )
            db.add(attendance)
            db.commit()
            return {"message": "Visitor added", "attended": True}
        
        # Regular member attendance
        if data.get('member_id'):
            # Check if member already exists for this event
            existing = db.query(EventAttendance).filter(
                EventAttendance.event_id == event_id,
                EventAttendance.member_id == data['member_id'],
                EventAttendance.deleted_at.is_(None)
            ).first()
            
            if existing:
                return {"message": "Member already checked in", "attended": existing.attended, "existing": True}
            
            return await add_attendance(event_id, data['member_id'], data.get('role'), current_user, db)
        
        raise ValueError("Invalid attendance data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{event_id}/attendance/{record_id}/toggle")
async def toggle_attendance(
    event_id: str,
    record_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Toggle check-in status for an attendance record by ID"""
    try:
        from app.models.event import EventAttendance
        from datetime import datetime
        import uuid
        
        # First try to find by record ID
        attendance = db.query(EventAttendance).filter(
            EventAttendance.id == record_id,
            EventAttendance.event_id == event_id,
            EventAttendance.deleted_at.is_(None)
        ).first()
        
        # If not found, try by member_id (for backward compatibility)
        if not attendance:
            attendance = db.query(EventAttendance).filter(
                EventAttendance.event_id == event_id,
                EventAttendance.member_id == record_id,
                EventAttendance.deleted_at.is_(None)
            ).first()
        
        if not attendance:
            # Create a new attendance record
            attendance = EventAttendance(
                id=str(uuid.uuid4()),
                event_id=event_id,
                member_id=record_id if record_id and record_id != 'undefined' else None,
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{event_id}/contributions")
async def add_contribution(
    event_id: str,
    data: EventContributionCreate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"📥 Contribution data received: {data.dict()}")
        # Add recorded_by
        data_dict = data.dict()
        data_dict['recorded_by'] = current_user.id
        return EventService.add_contribution(db, event_id, data_dict)
    except AppException as e:
        raise e
