from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List, Dict
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.models.member import Member
from app.models.meeting import Meeting, MeetingAttendance
from app.models.contribution import Contribution
from app.models.group import Group

class ReportService:
    
    @staticmethod
    def get_member_report(db: Session, organization_id: str) -> Dict:
        members = db.query(Member).filter(
            Member.village_id == organization_id,
            Member.deleted_at.is_(None)
        ).all()
        
        total_active = sum(1 for m in members if m.is_active)
        total_inactive = len(members) - total_active
        
        roles = {}
        for m in members:
            roles[m.role] = roles.get(m.role, 0) + 1
        
        return {
            "total_members": len(members),
            "active": total_active,
            "inactive": total_inactive,
            "roles": roles,
            "members": [{
                "id": m.id,
                "full_name": m.full_name,
                "phone": m.phone,
                "email": m.email,
                "role": m.role,
                "status": "Active" if m.is_active else "Inactive",
                "member_number": m.member_number
            } for m in members]
        }
    
    @staticmethod
    def get_meeting_report(db: Session, organization_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
        query = db.query(Meeting).filter(
            Meeting.village_id == organization_id,
            Meeting.deleted_at.is_(None)
        )
        
        if start_date:
            query = query.filter(Meeting.date >= start_date)
        if end_date:
            query = query.filter(Meeting.date <= end_date)
        
        meetings = query.all()
        
        total_meetings = len(meetings)
        completed = sum(1 for m in meetings if m.status == 'completed')
        scheduled = sum(1 for m in meetings if m.status == 'scheduled')
        ongoing = sum(1 for m in meetings if m.status == 'ongoing')
        cancelled = sum(1 for m in meetings if m.status == 'cancelled')
        
        return {
            "total": total_meetings,
            "completed": completed,
            "scheduled": scheduled,
            "ongoing": ongoing,
            "cancelled": cancelled,
            "meetings": [{
                "id": m.id,
                "title": m.title,
                "date": m.date.isoformat(),
                "time": m.time.isoformat(),
                "status": m.status,
                "attendance_count": m.total_attended or 0
            } for m in meetings]
        }
    
    @staticmethod
    def get_contribution_report(db: Session, organization_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
        query = db.query(Contribution).filter(
            Contribution.village_id == organization_id,
            Contribution.deleted_at.is_(None)
        )
        
        if start_date:
            query = query.filter(Contribution.created_at >= start_date)
        if end_date:
            query = query.filter(Contribution.created_at <= end_date)
        
        contributions = query.all()
        
        total_amount = sum(c.amount for c in contributions)
        total_paid = sum(c.paid_amount for c in contributions)
        total_pending = total_amount - total_paid
        
        status_counts = {}
        for c in contributions:
            status_counts[c.status] = status_counts.get(c.status, 0) + 1
        
        return {
            "total_contributions": len(contributions),
            "total_amount": float(total_amount),
            "total_paid": float(total_paid),
            "total_pending": float(total_pending),
            "status_counts": status_counts,
            "contributions": [{
                "id": c.id,
                "member_name": c.member.full_name if c.member else "Unknown",
                "amount": float(c.amount),
                "paid_amount": float(c.paid_amount),
                "status": c.status,
                "due_date": c.due_date.isoformat() if c.due_date else None
            } for c in contributions]
        }
    
    @staticmethod
    def get_attendance_report(db: Session, organization_id: str, member_id: Optional[str] = None) -> Dict:
        attendance_query = db.query(MeetingAttendance).filter(
            MeetingAttendance.deleted_at.is_(None)
        ).join(Meeting).filter(Meeting.village_id == organization_id)
        
        if member_id:
            attendance_query = attendance_query.filter(MeetingAttendance.member_id == member_id)
        
        attendance_records = attendance_query.all()
        
        present = sum(1 for a in attendance_records if a.attended and a.attendance_type == 'present')
        excused = sum(1 for a in attendance_records if a.attendance_type == 'excused')
        absent = sum(1 for a in attendance_records if not a.attended and a.attendance_type != 'excused')
        
        return {
            "total": len(attendance_records),
            "present": present,
            "excused": excused,
            "absent": absent,
            "attendance_rate": round(present / len(attendance_records) * 100, 2) if attendance_records else 0
        }
    
    @staticmethod
    def export_members_pdf(db: Session, organization_id: str) -> io.BytesIO:
        from app.models.village import Village
        village = db.query(Village).filter(Village.id == organization_id).first()
        org_name = village.name if village else "Organization"
        data = ReportService.get_member_report(db, organization_id)
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, alignment=TA_CENTER, spaceAfter=30)
        story.append(Paragraph(f"{org_name} - Member Report", title_style))
        story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y %I:%M %p')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Summary
        summary_data = [
            ['Total Members', str(data['total_members'])],
            ['Active Members', str(data['active'])],
            ['Inactive Members', str(data['inactive'])]
        ]
        summary_table = Table(summary_data, colWidths=[200, 100])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # Roles breakdown
        roles_data = [['Role', 'Count']]
        for role, count in data['roles'].items():
            roles_data.append([role.capitalize(), str(count)])
        
        roles_table = Table(roles_data, colWidths=[200, 100])
        roles_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ]))
        story.append(roles_table)
        story.append(Spacer(1, 20))
        
        # Member list
        story.append(Paragraph("Member Directory", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        member_data = [['#', 'Name', 'Member ID', 'Phone', 'Role', 'Status']]
        for idx, m in enumerate(data['members'], 1):
            member_data.append([
                str(idx),
                m['full_name'],
                m['member_number'] or 'N/A',
                m['phone'] or '-',
                m['role'].capitalize(),
                m['status']
            ])
        
        member_table = Table(member_data, colWidths=[40, 150, 80, 100, 80, 80])
        member_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ]))
        story.append(member_table)
        
        # Footer
        story.append(Spacer(1, 30))
        story.append(Paragraph("MtaaLink Village Management System", styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def export_meetings_pdf(db: Session, organization_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> io.BytesIO:
        from app.models.village import Village
        village = db.query(Village).filter(Village.id == organization_id).first()
        org_name = village.name if village else "Organization"
        data = ReportService.get_meeting_report(db, organization_id, start_date, end_date)
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, alignment=TA_CENTER, spaceAfter=30)
        story.append(Paragraph(f"{org_name} - Meeting Report", title_style))
        story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y %I:%M %p')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Summary
        summary_data = [
            ['Total Meetings', str(data['total'])],
            ['Completed', str(data['completed'])],
            ['Scheduled', str(data['scheduled'])],
            ['Ongoing', str(data['ongoing'])],
            ['Cancelled', str(data['cancelled'])]
        ]
        summary_table = Table(summary_data, colWidths=[200, 100])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # Meeting list
        story.append(Paragraph("Meeting History", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        meeting_data = [['#', 'Title', 'Date', 'Time', 'Status', 'Attendance']]
        for idx, m in enumerate(data['meetings'], 1):
            meeting_data.append([
                str(idx),
                m['title'],
                m['date'],
                m['time'],
                m['status'].capitalize(),
                str(m['attendance_count'])
            ])
        
        meeting_table = Table(meeting_data, colWidths=[40, 200, 80, 80, 80, 80])
        meeting_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ]))
        story.append(meeting_table)
        
        # Footer
        story.append(Spacer(1, 30))
        story.append(Paragraph("MtaaLink Village Management System", styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def export_contributions_pdf(db: Session, organization_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> io.BytesIO:
        from app.models.village import Village
        village = db.query(Village).filter(Village.id == organization_id).first()
        org_name = village.name if village else "Organization"
        data = ReportService.get_contribution_report(db, organization_id, start_date, end_date)
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, alignment=TA_CENTER, spaceAfter=30)
        story.append(Paragraph("Contributions Report", title_style))
        story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y %I:%M %p')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Summary
        summary_data = [
            ['Total Contributions', str(data['total_contributions'])],
            ['Total Amount', f"KES {data['total_amount']:,.2f}"],
            ['Total Paid', f"KES {data['total_paid']:,.2f}"],
            ['Total Pending', f"KES {data['total_pending']:,.2f}"]
        ]
        
        # Status counts
        for status, count in data['status_counts'].items():
            summary_data.append([f"Status: {status.capitalize()}", str(count)])
        
        summary_table = Table(summary_data, colWidths=[200, 100])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # Contributions list
        story.append(Paragraph("Contribution Details", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        contrib_data = [['#', 'Member', 'Amount', 'Paid', 'Status', 'Due Date']]
        for idx, c in enumerate(data['contributions'], 1):
            contrib_data.append([
                str(idx),
                c['member_name'],
                f"KES {c['amount']:,.2f}",
                f"KES {c['paid_amount']:,.2f}",
                c['status'].capitalize(),
                c['due_date'] or '-'
            ])
        
        contrib_table = Table(contrib_data, colWidths=[40, 150, 80, 80, 80, 100])
        contrib_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (2, 0), (3, -1), 'RIGHT'),
        ]))
        story.append(contrib_table)
        
        # Footer
        story.append(Spacer(1, 30))
        story.append(Paragraph("MtaaLink Village Management System", styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def export_attendance_pdf(db: Session, organization_id: str, member_id: Optional[str] = None) -> io.BytesIO:
        from app.models.village import Village
        village = db.query(Village).filter(Village.id == organization_id).first()
        org_name = village.name if village else "Organization"
        data = ReportService.get_attendance_report(db, organization_id, member_id)
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, alignment=TA_CENTER, spaceAfter=30)
        story.append(Paragraph(f"{org_name} - Attendance Report", title_style))
        story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y %I:%M %p')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Summary
        summary_data = [
            ['Total Attendance Records', str(data['total'])],
            ['Present', str(data['present'])],
            ['Excused', str(data['excused'])],
            ['Absent', str(data['absent'])],
            ['Attendance Rate', f"{data['attendance_rate']}%"]
        ]
        summary_table = Table(summary_data, colWidths=[200, 100])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ]))
        story.append(summary_table)
        
        # Footer
        story.append(Spacer(1, 30))
        story.append(Paragraph("MtaaLink Village Management System", styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer

    @staticmethod
    def get_election_report(db: Session, organization_id: str) -> Dict:
        """Get elections report with results"""
        from app.models.election import Election, ElectionCandidate, ElectionVoter
        
        elections = db.query(Election).filter(
            Election.organization_id == organization_id,
            Election.deleted_at.is_(None)
        ).all()
        
        report = []
        for election in elections:
            candidates = db.query(ElectionCandidate).filter(
                ElectionCandidate.election_id == election.id
            ).all()
            
            voters = db.query(ElectionVoter).filter(
                ElectionVoter.election_id == election.id
            ).all()
            
            total_votes = sum(1 for v in voters if v.has_voted)
            total_voters = len(voters)
            turnout = round((total_votes / total_voters * 100) if total_voters > 0 else 0, 1)
            
            candidate_results = []
            for c in candidates:
                vote_count = db.query(ElectionVoter).filter(
                    ElectionVoter.election_id == election.id,
                    ElectionVoter.candidate_id == c.id,
                    ElectionVoter.has_voted == True
                ).count()
                candidate_results.append({
                    "name": c.name,
                    "votes": vote_count,
                    "percentage": round((vote_count / total_votes * 100) if total_votes > 0 else 0, 1)
                })
            
            report.append({
                "id": election.id,
                "title": election.title,
                "status": election.status,
                "election_type": election.election_type,
                "start_date": election.start_date.isoformat() if election.start_date else None,
                "end_date": election.end_date.isoformat() if election.end_date else None,
                "total_voters": total_voters,
                "total_votes": total_votes,
                "turnout": turnout,
                "candidates": candidate_results
            })
        
        return {
            "total_elections": len(report),
            "elections": report
        }

    @staticmethod
    def export_elections_pdf(db: Session, organization_id: str) -> io.BytesIO:
        """Export elections report as PDF"""
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.lib.units import inch
        
        data = ReportService.get_election_report(db, organization_id)
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        # Title
        title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=18, alignment=1)
        elements.append(Paragraph(f"{org_name} - Elections Report", title_style))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"Total Elections: {data['total_elections']}", styles['Normal']))
        elements.append(Spacer(1, 12))
        
        for election in data['elections']:
            # Election header
            elements.append(Paragraph(f"<b>{election['title']}</b>", styles['Heading2']))
            elements.append(Paragraph(f"Status: {election['status']} | Type: {election['election_type']} | Turnout: {election['turnout']}%", styles['Normal']))
            elements.append(Spacer(1, 6))
            
            if election['candidates']:
                # Candidate results table
                table_data = [["Candidate", "Votes", "Percentage"]]
                for c in election['candidates']:
                    table_data.append([c['name'], str(c['votes']), f"{c['percentage']}%"])
                
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
            else:
                elements.append(Paragraph("No candidates found", styles['Normal']))
            
            elements.append(Spacer(1, 12))
        
        doc.build(elements)
        buffer.seek(0)
        return buffer

    @staticmethod
    def get_group_report(db: Session, organization_id: str) -> Dict:
        """Get groups report"""
        from app.models.group import Group, GroupMember
        
        groups = db.query(Group).filter(
            Group.village_id == organization_id,
            Group.deleted_at.is_(None)
        ).all()
        
        group_list = []
        total_members = 0
        
        for g in groups:
            # Count members in this group
            member_count = db.query(GroupMember).filter(
                GroupMember.group_id == g.id
            ).count()
            total_members += member_count
            
            group_list.append({
                "id": g.id,
                "name": g.name,
                "description": g.description,
                "member_count": member_count,
                "created_at": g.created_at.isoformat() if g.created_at else None
            })
        
        return {
            "total_groups": len(groups),
            "total_members": total_members,
            "groups": group_list
        }

    @staticmethod
    def export_groups_pdf(db: Session, organization_id: str) -> io.BytesIO:
        """Export groups report as PDF"""
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from app.models.village import Village
        
        # Get organization name
        village = db.query(Village).filter(Village.id == organization_id).first()
        org_name = village.name if village else "Organization"
        
        data = ReportService.get_group_report(db, organization_id)
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        # Title
        title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=18, alignment=1)
        elements.append(Paragraph(f"{org_name} - Groups Report", title_style))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"Total Groups: {data['total_groups']} | Total Members: {data['total_members']}", styles['Normal']))
        elements.append(Spacer(1, 12))
        
        if data['groups']:
            table_data = [["#", "Group Name", "Members", "Description"]]
            for i, g in enumerate(data['groups']):
                table_data.append([str(i+1), g['name'], str(g['member_count']), g['description'] or '-'])
            
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
        return buffer

    @staticmethod
    def export_projects_pdf(db: Session, organization_id: str) -> io.BytesIO:
        from app.models.project import Project
        from app.models.village import Village
        
        village = db.query(Village).filter(Village.id == organization_id).first()
        org_name = village.name if village else "Organization"
        
        projects = db.query(Project).filter(
            Project.village_id == organization_id,
            Project.deleted_at.is_(None)
        ).all()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, alignment=TA_CENTER, spaceAfter=30)
        story.append(Paragraph(f"{org_name} - Projects Report", title_style))
        story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y %I:%M %p')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        data = []
        for p in projects:
            data.append([p.title, p.status or 'Draft', str(p.budget or 0), str(p.amount_spent or 0)])
        
        if data:
            table = Table([['Title', 'Status', 'Budget', 'Spent']] + data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(table)
        else:
            story.append(Paragraph("No projects found", styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer

    @staticmethod
    def export_events_pdf(db: Session, organization_id: str) -> io.BytesIO:
        from app.models.event import Event
        from app.models.village import Village
        
        village = db.query(Village).filter(Village.id == organization_id).first()
        org_name = village.name if village else "Organization"
        
        events = db.query(Event).filter(
            Event.village_id == organization_id,
            Event.deleted_at.is_(None)
        ).all()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, alignment=TA_CENTER, spaceAfter=30)
        story.append(Paragraph(f"{org_name} - Events Report", title_style))
        story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y %I:%M %p')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        data = []
        for e in events:
            data.append([e.title, e.event_type or 'General', e.status or 'Upcoming'])
        
        if data:
            table = Table([['Title', 'Type', 'Status']] + data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(table)
        else:
            story.append(Paragraph("No events found", styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer

    @staticmethod
    def export_announcements_pdf(db: Session, organization_id: str) -> io.BytesIO:
        from app.models.announcement import Announcement
        from app.models.village import Village
        
        village = db.query(Village).filter(Village.id == organization_id).first()
        org_name = village.name if village else "Organization"
        
        announcements = db.query(Announcement).filter(
            Announcement.village_id == organization_id,
            Announcement.deleted_at.is_(None)
        ).all()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, alignment=TA_CENTER, spaceAfter=30)
        story.append(Paragraph(f"{org_name} - Announcements Report", title_style))
        story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y %I:%M %p')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        data = []
        for a in announcements:
            data.append([a.title, a.message[:50] + '...' if len(a.message) > 50 else a.message, a.status or 'Draft'])
        
        if data:
            table = Table([['Title', 'Message', 'Status']] + data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(table)
        else:
            story.append(Paragraph("No announcements found", styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer

    @staticmethod
    def export_summary_pdf(db: Session, organization_id: str) -> io.BytesIO:
        from app.models.village import Village
        from app.models.member import Member
        from app.models.meeting import Meeting
        from app.models.group import Group
        from app.models.contribution import Contribution
        
        village = db.query(Village).filter(Village.id == organization_id).first()
        org_name = village.name if village else "Organization"
        
        total_members = db.query(Member).filter(Member.village_id == organization_id, Member.deleted_at.is_(None)).count()
        total_meetings = db.query(Meeting).filter(Meeting.village_id == organization_id, Meeting.deleted_at.is_(None)).count()
        total_groups = db.query(Group).filter(Group.village_id == organization_id, Group.deleted_at.is_(None)).count()
        
        contributions = db.query(Contribution).filter(Contribution.village_id == organization_id, Contribution.deleted_at.is_(None)).all()
        total_contributions = sum(c.amount for c in contributions)
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, alignment=TA_CENTER, spaceAfter=30)
        story.append(Paragraph(f"{org_name} - Summary Report", title_style))
        story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y %I:%M %p')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        data = [
            ['Total Members', str(total_members)],
            ['Total Meetings', str(total_meetings)],
            ['Total Groups', str(total_groups)],
            ['Total Contributions', f"KES {total_contributions:,.2f}"],
        ]
        
        table = Table(data, colWidths=[200, 100])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ]))
        story.append(table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer
