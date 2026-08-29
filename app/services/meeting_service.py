import uuid
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, date, time
from app.core.exceptions import NotFoundException
from app.models.meeting import Meeting, MeetingAttendance, MeetingActionItem, MeetingMotion
from app.models.member import Member

class MeetingService:
    @staticmethod
    def get_meetings(db: Session, village_id: str, status: Optional[str] = None) -> List[Dict]:
        query = db.query(Meeting).filter(
            Meeting.village_id == village_id,
            Meeting.deleted_at.is_(None)
        )
        
        if status:
            query = query.filter(Meeting.status == status)
        
        meetings = query.order_by(Meeting.date.desc()).all()
        
        result = []
        for m in meetings:
            attendance_count = db.query(MeetingAttendance).filter(
                MeetingAttendance.meeting_id == m.id,
                MeetingAttendance.attended == True,
                MeetingAttendance.attendance_type == 'present',
                MeetingAttendance.deleted_at.is_(None)
            ).count()
            
            result.append({
                "id": str(m.id),
                "title": m.title,
                "date": m.date.isoformat(),
                "time": m.time.isoformat() if m.time else None,
                "location": m.location,
                "status": m.status,
                "attendance_count": attendance_count,
                "quorum_required": m.quorum_required
            })
        
        return result
    
    @staticmethod
    def get_meeting(db: Session, village_id: str, meeting_id: str) -> Dict:
        meeting = db.query(Meeting).filter(
            Meeting.id == meeting_id,
            Meeting.village_id == village_id,
            Meeting.deleted_at.is_(None)
        ).first()
        
        if not meeting:
            raise NotFoundException("Meeting")
        
        attendance = db.query(MeetingAttendance).filter(
            MeetingAttendance.meeting_id == meeting_id,
            MeetingAttendance.deleted_at.is_(None)
        ).all()
        
        attendance_data = []
        present_count = 0
        for a in attendance:
            member = db.query(Member).filter(Member.id == a.member_id).first()
            if not member:
                continue
                
            att_type = a.attendance_type or 'absent'
            if a.attended and att_type == 'present':
                present_count += 1
            
            attendance_data.append({
                "member_id": str(a.member_id),
                "member_name": member.full_name if member else "Unknown",
                "attended": a.attended,
                "attendance_type": att_type,
                "check_in_time": a.check_in_time.isoformat() if a.check_in_time else None
            })
        
        return {
            "meeting": meeting,
            "attendance": attendance_data,
            "present_count": present_count
        }
    
    @staticmethod
    def create_meeting(db: Session, village_id: str, data: dict, current_user_id: str) -> Dict:
        # Convert date string to date object
        meeting_date = data.get('date')
        if isinstance(meeting_date, str):
            meeting_date = date.fromisoformat(meeting_date)
        
        # Convert time string to time object
        meeting_time = data.get('time')
        if isinstance(meeting_time, str):
            try:
                meeting_time = time.fromisoformat(meeting_time)
            except ValueError:
                # Handle time formats like "14:00" without seconds
                parts = meeting_time.split(':')
                if len(parts) == 2:
                    meeting_time = time(int(parts[0]), int(parts[1]))
                else:
                    meeting_time = time(14, 0)  # default
        
        meeting = Meeting(
            village_id=village_id,
            title=data['title'],
            description=data.get('description'),
            date=meeting_date,
            time=meeting_time,
            end_time=None,
            location=data.get('location'),
            meeting_type=data.get('meeting_type', 'general'),
            agenda=data.get('agenda'),
            quorum_required=data.get('quorum_required', 10),
            chairperson_id=data.get('chairperson_id'),
            secretary_id=data.get('secretary_id'),
            created_by=current_user_id,
            status='scheduled'
        )
        
        db.add(meeting)
        db.commit()
        db.refresh(meeting)
        
        return {"id": str(meeting.id), "message": f"Meeting '{meeting.title}' created"}
    
    @staticmethod
    def update_meeting(db: Session, village_id: str, meeting_id: str, data: dict) -> Dict:
        meeting = db.query(Meeting).filter(
            Meeting.id == meeting_id,
            Meeting.village_id == village_id,
            Meeting.deleted_at.is_(None)
        ).first()
        
        if not meeting:
            raise NotFoundException("Meeting")
        
        for field, value in data.items():
            if value is not None and hasattr(meeting, field):
                # Convert date if needed
                if field == 'date' and isinstance(value, str):
                    value = date.fromisoformat(value)
                elif field == 'time' and isinstance(value, str):
                    try:
                        value = time.fromisoformat(value)
                    except ValueError:
                        parts = value.split(':')
                        if len(parts) == 2:
                            value = time(int(parts[0]), int(parts[1]))
                setattr(meeting, field, value)
        
        db.commit()
        db.refresh(meeting)
        
        return {"message": f"Meeting '{meeting.title}' updated"}
    
    @staticmethod
    def start_meeting(db: Session, village_id: str, meeting_id: str) -> Dict:
        meeting = db.query(Meeting).filter(
            Meeting.id == meeting_id,
            Meeting.village_id == village_id
        ).first()
        
        if not meeting:
            raise NotFoundException("Meeting")
        
        if meeting.status != "scheduled":
            raise ValueError("Meeting must be scheduled to start")
        
        meeting.status = "ongoing"
        db.commit()
        
        return {"message": "Meeting started"}
    
    @staticmethod
    def complete_meeting(db: Session, village_id: str, meeting_id: str, minutes: str) -> Dict:
        meeting = db.query(Meeting).filter(
            Meeting.id == meeting_id,
            Meeting.village_id == village_id
        ).first()
        
        if not meeting:
            raise NotFoundException("Meeting")
        
        meeting.status = "completed"
        meeting.minutes = minutes
        meeting.minutes_approved = True
        meeting.minutes_approved_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Meeting completed"}
    
    @staticmethod
    def mark_attendance(db: Session, meeting_id: str, member_ids: list) -> Dict:
        db.query(MeetingAttendance).filter(
            MeetingAttendance.meeting_id == meeting_id
        ).update({"deleted_at": datetime.utcnow()})
        
        for member_id in member_ids:
            attendance = MeetingAttendance(
                meeting_id=meeting_id,
                member_id=member_id,
                attended=True,
                attendance_type='present',
                check_in_time=datetime.utcnow()
            )
            db.add(attendance)
        
        db.commit()
        
        return {"message": f"Attendance marked for {len(member_ids)} members"}

    @staticmethod
    def send_meeting_invitation(db: Session, meeting_id: str, village_id: str) -> Dict:
        """Send meeting invitation SMS to all members"""
        from app.models.meeting import Meeting, MeetingAttendance
        from app.models.member import Member
        from app.services.sms_service import SMSService
        
        village_name = SMSService.get_village_name(db, village_id)
        
        meeting = db.query(Meeting).filter(
            Meeting.id == meeting_id,
            Meeting.village_id == village_id
        ).first()
        
        if not meeting:
            return {"success": False, "error": "Meeting not found"}
        
        # Get all members
        members = db.query(Member).filter(
            Member.village_id == village_id,
            Member.deleted_at.is_(None)
        ).all()
        
        sent_count = 0
        for member in members:
            if member.phone:
                message = f"""{village_name} Meeting Invitation

{meeting.title}
Date: {meeting.date}
Time: {meeting.time}
Location: {meeting.location or 'Village Hall'}

Please attend."""
                
                result = SMSService.send_sms(member.phone, message, village_name)
                if result.get('success'):
                    sent_count += 1
        
        return {"sent": sent_count, "total": len(members)}

    @staticmethod
    def export_meeting_report_pdf(db: Session, meeting_id: str, village_id: str) -> bytes:
        """Export meeting as PDF with village name"""
        from app.models.meeting import Meeting, MeetingAttendance
        from app.models.member import Member
        from app.services.sms_service import SMSService
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        import io
        
        village_name = SMSService.get_village_name(db, village_id)
        
        meeting = db.query(Meeting).filter(
            Meeting.id == meeting_id,
            Meeting.village_id == village_id
        ).first()
        
        if not meeting:
            return None
        
        # Get attendance
        attendance = db.query(MeetingAttendance).filter(
            MeetingAttendance.meeting_id == meeting_id
        ).all()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        # Title with village name
        title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=20, alignment=1)
        elements.append(Paragraph(f"{village_name} - Meeting Report", title_style))
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(f"<b>{meeting.title}</b>", styles['Heading2']))
        elements.append(Spacer(1, 6))
        
        # Meeting details
        elements.append(Paragraph(f"Date: {meeting.date}", styles['Normal']))
        elements.append(Paragraph(f"Time: {meeting.time}", styles['Normal']))
        elements.append(Paragraph(f"Location: {meeting.location or 'Village Hall'}", styles['Normal']))
        elements.append(Paragraph(f"Status: {meeting.status}", styles['Normal']))
        elements.append(Spacer(1, 12))
        
        if meeting.agenda:
            elements.append(Paragraph("<b>Agenda</b>", styles['Heading3']))
            elements.append(Paragraph(meeting.agenda, styles['Normal']))
            elements.append(Spacer(1, 6))
        
        if meeting.minutes:
            elements.append(Paragraph("<b>Minutes</b>", styles['Heading3']))
            elements.append(Paragraph(meeting.minutes, styles['Normal']))
            elements.append(Spacer(1, 6))
        
        # Attendance
        if attendance:
            elements.append(Paragraph("<b>Attendance</b>", styles['Heading3']))
            table_data = [["Member", "Status", "Check-in Time"]]
            for a in attendance:
                member = db.query(Member).filter(Member.id == a.member_id).first()
                member_name = member.full_name if member else "Unknown"
                status = "Present" if a.attended else "Absent"
                check_in = a.check_in_time.strftime("%H:%M") if a.check_in_time else "-"
                table_data.append([member_name, status, check_in])
            
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(table)
        
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def add_motion(db: Session, meeting_id: str, data: dict, user_id: str) -> Dict:
        """Add a motion to a meeting"""
        from app.models.meeting import Meeting, MeetingMotion
        
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            raise NotFoundException("Meeting not found")
        
        motion = MeetingMotion(
            id=str(uuid.uuid4()),
            meeting_id=meeting_id,
            title=data.get('title'),
            description=data.get('description'),
            proposed_by=user_id,
            seconded_by=data.get('seconded_by'),
            status='proposed'
        )
        db.add(motion)
        db.commit()
        db.refresh(motion)
        
        return {"message": "Motion added successfully", "motion": {"id": motion.id, "title": motion.title}}

    @staticmethod
    def get_motions(db: Session, meeting_id: str) -> List[Dict]:
        """Get all motions for a meeting"""
        from app.models.meeting import MeetingMotion
        from app.models.member import Member
        
        motions = db.query(MeetingMotion).filter(
            MeetingMotion.meeting_id == meeting_id,
            MeetingMotion.deleted_at.is_(None)
        ).all()
        
        result = []
        for m in motions:
            # Get proposer name
            proposer_name = None
            if m.proposed_by:
                proposer = db.query(Member).filter(Member.id == m.proposed_by).first()
                if proposer:
                    proposer_name = proposer.full_name
            
            # Get seconder name
            seconder_name = None
            if m.seconded_by:
                seconder = db.query(Member).filter(Member.id == m.seconded_by).first()
                if seconder:
                    seconder_name = seconder.full_name
            
            result.append({
                "id": m.id,
                "title": m.title,
                "description": m.description,
                "status": m.status,
                "proposed_by": m.proposed_by,
                "proposer_name": proposer_name,
                "seconded_by": m.seconded_by,
                "seconder_name": seconder_name,
                "votes_for": m.votes_for or 0,
                "votes_against": m.votes_against or 0,
                "votes_abstain": m.votes_abstain or 0,
                "created_at": m.created_at.isoformat() if m.created_at else None
            })
        return result

    @staticmethod
    def vote_motion(db: Session, meeting_id: str, motion_id: str, data: dict, user_id: str) -> Dict:
        """Vote on a motion"""
        from app.models.meeting import MeetingMotion, MeetingMotionVote
        
        motion = db.query(MeetingMotion).filter(
            MeetingMotion.id == motion_id,
            MeetingMotion.meeting_id == meeting_id
        ).first()
        if not motion:
            raise NotFoundException("Motion not found")
        
        vote_type = data.get('vote')  # 'for', 'against', 'abstain'
        
        # Check if user already voted
        existing = db.query(MeetingMotionVote).filter(
            MeetingMotionVote.motion_id == motion_id,
            MeetingMotionVote.member_id == user_id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="You already voted on this motion")
        
        vote = MeetingMotionVote(
            id=str(uuid.uuid4()),
            motion_id=motion_id,
            member_id=user_id,
            vote_type=vote_type
        )
        db.add(vote)
        
        # Update vote counts
        if vote_type == 'for':
            motion.votes_for = (motion.votes_for or 0) + 1
        elif vote_type == 'against':
            motion.votes_against = (motion.votes_against or 0) + 1
        elif vote_type == 'abstain':
            motion.votes_abstain = (motion.votes_abstain or 0) + 1
        
        db.commit()
        
        return {"message": "Vote recorded"}

    @staticmethod
    def add_action_item(db: Session, meeting_id: str, data: dict, user_id: str) -> Dict:
        """Add an action item to a meeting"""
        from app.models.meeting import Meeting, MeetingActionItem
        
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            raise NotFoundException("Meeting not found")
        
        action_item = MeetingActionItem(
            id=str(uuid.uuid4()),
            meeting_id=meeting_id,
            description=data.get('description'),
            assigned_to=data.get('assigned_to'),
            due_date=data.get('due_date'),
            priority=data.get('priority', 'medium'),
            status='pending'
        )
        db.add(action_item)
        db.commit()
        db.refresh(action_item)
        
        return {"message": "Action item added", "action_item": {"id": action_item.id, "description": action_item.description}}

    @staticmethod
    def get_action_items(db: Session, meeting_id: str) -> List[Dict]:
        """Get all action items for a meeting"""
        from app.models.meeting import MeetingActionItem
        from app.models.member import Member
        
        items = db.query(MeetingActionItem).filter(
            MeetingActionItem.meeting_id == meeting_id,
            MeetingActionItem.deleted_at.is_(None)
        ).all()
        
        result = []
        for i in items:
            # Get assignee name
            assignee_name = None
            if i.assigned_to:
                assignee = db.query(Member).filter(Member.id == i.assigned_to).first()
                if assignee:
                    assignee_name = assignee.full_name
            
            result.append({
                "id": i.id,
                "description": i.description,
                "assigned_to": i.assigned_to,
                "assignee_name": assignee_name,
                "due_date": i.due_date.isoformat() if i.due_date else None,
                "priority": i.priority,
                "status": i.status,
                "created_at": i.created_at.isoformat() if i.created_at else None
            })
        return result

    @staticmethod
    def update_action_item(db: Session, meeting_id: str, item_id: str, data: dict) -> Dict:
        """Update an action item"""
        from app.models.meeting import MeetingActionItem
        
        item = db.query(MeetingActionItem).filter(
            MeetingActionItem.id == item_id,
            MeetingActionItem.meeting_id == meeting_id
        ).first()
        if not item:
            raise NotFoundException("Action item not found")
        
        if 'status' in data:
            item.status = data['status']
        if 'description' in data:
            item.description = data['description']
        if 'assigned_to' in data:
            item.assigned_to = data['assigned_to']
        if 'due_date' in data:
            item.due_date = data['due_date']
        if 'priority' in data:
            item.priority = data['priority']
        
        db.commit()
        db.refresh(item)
        
        return {"message": "Action item updated"}
