from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.core.exceptions import AppException
from app.models.member import Member
from app.models.meeting import Meeting, MeetingAttendance
from app.services.meeting_service import MeetingService

router = APIRouter(prefix="/api/v1/meetings", tags=["Meetings"])

@router.get("/")
async def get_meetings(
    status: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return MeetingService.get_meetings(db, current_user.village_id, status)
    except AppException as e:
        raise e

@router.get("/{meeting_id}")
async def get_meeting(
    meeting_id: str,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return MeetingService.get_meeting(db, current_user.village_id, meeting_id)
    except AppException as e:
        raise e

@router.post("/")
async def create_meeting(
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return MeetingService.create_meeting(db, current_user.village_id, data, current_user.id)
    except AppException as e:
        raise e

@router.put("/{meeting_id}")
async def update_meeting(
    meeting_id: str,
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return MeetingService.update_meeting(db, current_user.village_id, meeting_id, data)
    except AppException as e:
        raise e

@router.post("/{meeting_id}/start")
async def start_meeting(
    meeting_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return MeetingService.start_meeting(db, current_user.village_id, meeting_id)
    except AppException as e:
        raise e

@router.post("/{meeting_id}/complete")
async def complete_meeting(
    meeting_id: str,
    request: Request,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    data = await request.json()
    minutes = data.get('minutes', '')
    try:
        return MeetingService.complete_meeting(db, current_user.village_id, meeting_id, minutes)
    except AppException as e:
        raise e

@router.post("/{meeting_id}/attendance")
async def mark_attendance(
    meeting_id: str,
    member_ids: List[str],
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return MeetingService.mark_attendance(db, meeting_id, member_ids)
    except AppException as e:
        raise e

@router.post("/{meeting_id}/attendance-with-status")
async def mark_attendance_with_status(
    meeting_id: str,
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Mark attendance with status (present/excused/absent)"""
    try:
        # Get the meeting
        meeting = db.query(Meeting).filter(
            Meeting.id == meeting_id,
            Meeting.village_id == current_user.village_id,
            Meeting.deleted_at.is_(None)
        ).first()
        
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        present_ids = data.get('present', [])
        excused_ids = data.get('excused', [])
        
        # Get all active members in the village
        all_members = db.query(Member).filter(
            Member.village_id == current_user.village_id,
            Member.is_active == True,
            Member.deleted_at.is_(None)
        ).all()
        
        # Soft delete existing attendance for this meeting
        db.query(MeetingAttendance).filter(
            MeetingAttendance.meeting_id == meeting_id,
            MeetingAttendance.deleted_at.is_(None)
        ).update({"deleted_at": datetime.utcnow()})
        
        # Create new attendance records
        for member in all_members:
            attendance_type = 'absent'
            attended = False
            
            if member.id in present_ids:
                attendance_type = 'present'
                attended = True
            elif member.id in excused_ids:
                attendance_type = 'excused'
                attended = False
            
            att = MeetingAttendance(
                meeting_id=meeting_id,
                member_id=member.id,
                attended=attended,
                attendance_type=attendance_type,
                check_in_time=datetime.utcnow() if attended else None
            )
            db.add(att)
        
        # Update meeting attendance count - ONLY count "present" members
        present_count = len(present_ids)
        meeting.total_attended = present_count
        meeting.quorum_met = present_count >= meeting.quorum_required
        
        db.commit()
        
        return {
            "message": f"Attendance marked: {present_count} present, {len(excused_ids)} excused",
            "present": present_count,
            "excused": len(excused_ids),
            "total": len(all_members)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{meeting_id}")
async def delete_meeting(
    meeting_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a meeting (soft delete)"""
    try:
        meeting = db.query(Meeting).filter(
            Meeting.id == meeting_id,
            Meeting.village_id == current_user.village_id,
            Meeting.deleted_at.is_(None)
        ).first()
        
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        # Only allow deletion if meeting is scheduled or draft
        if meeting.status not in ['scheduled', 'draft']:
            raise HTTPException(status_code=400, detail="Only scheduled or draft meetings can be deleted")
        
        meeting.deleted_at = datetime.utcnow()
        db.commit()
        
        return {"message": f"Meeting '{meeting.title}' deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{meeting_id}/invite/")
async def send_meeting_invitation(
    meeting_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Send meeting invitation SMS to all members"""
    try:
        return MeetingService.send_meeting_invitation(db, meeting_id, current_user.village_id)
    except AppException as e:
        raise e

# ===== MOTIONS =====
@router.post("/{meeting_id}/motions")
async def add_motion(
    meeting_id: str,
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Add a motion to a meeting"""
    try:
        return MeetingService.add_motion(db, meeting_id, data, current_user.id)
    except AppException as e:
        raise e

@router.get("/{meeting_id}/motions")
async def get_motions(
    meeting_id: str,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all motions for a meeting"""
    try:
        return MeetingService.get_motions(db, meeting_id)
    except AppException as e:
        raise e

@router.post("/{meeting_id}/motions/{motion_id}/vote")
async def vote_motion(
    meeting_id: str,
    motion_id: str,
    data: dict,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vote on a motion"""
    try:
        return MeetingService.vote_motion(db, meeting_id, motion_id, data, current_user.id)
    except AppException as e:
        raise e

# ===== ACTION ITEMS =====
@router.post("/{meeting_id}/action-items")
async def add_action_item(
    meeting_id: str,
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Add an action item to a meeting"""
    try:
        return MeetingService.add_action_item(db, meeting_id, data, current_user.id)
    except AppException as e:
        raise e

@router.get("/{meeting_id}/action-items")
async def get_action_items(
    meeting_id: str,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all action items for a meeting"""
    try:
        return MeetingService.get_action_items(db, meeting_id)
    except AppException as e:
        raise e

@router.put("/{meeting_id}/action-items/{item_id}")
async def update_action_item(
    meeting_id: str,
    item_id: str,
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update an action item"""
    try:
        return MeetingService.update_action_item(db, meeting_id, item_id, data)
    except AppException as e:
        raise e
