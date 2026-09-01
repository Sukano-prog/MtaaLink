from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
import io
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.member import Member
from app.models.meeting import Meeting, MeetingAttendance
from app.models.contribution import Contribution
from app.models.group import Group
from app.services.report_service import ReportService

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])

@router.get("/members")
async def get_member_report(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get member report data"""
    try:
        return ReportService.get_member_report(db, current_user.village_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/meetings")
async def get_meeting_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get meeting report data"""
    try:
        return ReportService.get_meeting_report(db, current_user.village_id, start_date, end_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/contributions")
async def get_contribution_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get contribution report data"""
    try:
        return ReportService.get_contribution_report(db, current_user.village_id, start_date, end_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/attendance")
async def get_attendance_report(
    member_id: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get attendance report data"""
    try:
        return ReportService.get_attendance_report(db, current_user.village_id, member_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/members/pdf")
async def export_members_pdf(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export members report as PDF"""
    try:
        pdf_buffer = ReportService.export_members_pdf(db, current_user.village_id)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=members_report_{datetime.now().strftime('%Y%m%d')}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/meetings/pdf")
async def export_meetings_pdf(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export meetings report as PDF"""
    try:
        pdf_buffer = ReportService.export_meetings_pdf(db, current_user.village_id, start_date, end_date)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=meetings_report_{datetime.now().strftime('%Y%m%d')}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/contributions/pdf")
async def export_contributions_pdf(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export contributions report as PDF"""
    try:
        pdf_buffer = ReportService.export_contributions_pdf(db, current_user.village_id, start_date, end_date)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=contributions_report_{datetime.now().strftime('%Y%m%d')}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/attendance/pdf")
async def export_attendance_pdf(
    member_id: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export attendance report as PDF"""
    try:
        pdf_buffer = ReportService.export_attendance_pdf(db, current_user.village_id, member_id)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=attendance_report_{datetime.now().strftime('%Y%m%d')}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/elections")
async def get_election_report(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get elections report data with results"""
    try:
        return ReportService.get_election_report(db, current_user.village_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/elections/pdf")
async def export_elections_pdf(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export elections report as PDF"""
    try:
        pdf_buffer = ReportService.export_elections_pdf(db, current_user.village_id)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=elections_report_{datetime.now().strftime('%Y%m%d')}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/groups")
async def get_group_report(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get groups report data"""
    try:
        return ReportService.get_group_report(db, current_user.village_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/groups/pdf")
async def export_groups_pdf(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export groups report as PDF"""
    try:
        pdf_buffer = ReportService.export_groups_pdf(db, current_user.village_id)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=groups_report_{datetime.now().strftime('%Y%m%d')}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects")
async def get_project_report(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get projects report data"""
    try:
        return ReportService.get_project_report(db, current_user.village_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events")
async def get_event_report(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get events report data"""
    try:
        return ReportService.get_event_report(db, current_user.village_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/announcements")
async def get_announcement_report(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get announcements report data"""
    try:
        return ReportService.get_announcement_report(db, current_user.village_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary")
async def get_summary_report(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get village summary report"""
    try:
        return ReportService.get_summary_report(db, current_user.village_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/projects/pdf")
async def export_projects_pdf(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export projects report as PDF"""
    try:
        pdf_buffer = ReportService.export_projects_pdf(db, current_user.village_id)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=projects_report_{datetime.now().strftime('%Y%m%d')}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/events/pdf")
async def export_events_pdf(
    event_id: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export event report as PDF. If event_id is provided, export single event, otherwise export all events."""
    try:
        if event_id:
            pdf_buffer = ReportService.export_event_pdf(db, current_user.village_id, event_id)
            filename = f"event_report_{datetime.now().strftime('%Y%m%d')}.pdf"
        else:
            pdf_buffer = ReportService.export_events_pdf(db, current_user.village_id)
            filename = f"events_report_{datetime.now().strftime('%Y%m%d')}.pdf"
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/announcements/pdf")
async def export_announcements_pdf(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export announcements report as PDF"""
    try:
        pdf_buffer = ReportService.export_announcements_pdf(db, current_user.village_id)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=announcements_report_{datetime.now().strftime('%Y%m%d')}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/summary/pdf")
async def export_summary_pdf(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export village summary as PDF"""
    try:
        pdf_buffer = ReportService.export_summary_pdf(db, current_user.village_id)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=village_summary_{datetime.now().strftime('%Y%m%d')}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
