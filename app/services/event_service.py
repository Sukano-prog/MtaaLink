from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime, date
from decimal import Decimal
from app.core.exceptions import NotFoundException
from app.models.event import Event, EventAttendance, EventContribution, EventExpense
from app.models.member import Member

class EventService:
    
    @staticmethod
    def get_events(db: Session, village_id: str, event_type: Optional[str] = None, search: Optional[str] = None) -> List[Dict]:
        query = db.query(Event).filter(
            Event.village_id == village_id,
            Event.deleted_at.is_(None)
        )
        
        if event_type:
            query = query.filter(Event.event_type == event_type)
        if search:
            query = query.filter(
                Event.title.ilike(f'%{search}%') | 
                Event.description.ilike(f'%{search}%')
            )
        
        events = query.order_by(Event.date.desc()).all()
        
        result = []
        for e in events:
            organizer = db.query(Member).filter(Member.id == e.organizer).first()
            
            attendance_count = db.query(EventAttendance).filter(
                EventAttendance.event_id == e.id,
                EventAttendance.deleted_at.is_(None)
            ).count()
            
            contributions = db.query(EventContribution).filter(
                EventContribution.event_id == e.id,
                EventContribution.deleted_at.is_(None)
            ).all()
            
            total_amount = sum(c.amount or 0 for c in contributions)
            
            result.append({
                "id": str(e.id),
                "title": e.title,
                "description": e.description,
                "event_type": e.event_type,
                "date": e.date.isoformat(),
                "location": e.location,
                "status": e.status,
                "organizer_name": organizer.full_name if organizer else None,
                "attendance_count": attendance_count,
                "contribution_count": len(contributions),
                "total_contributions": float(total_amount),
                "created_at": e.created_at.isoformat()
            })
        
        return result
    
    @staticmethod
    def get_event(db: Session, village_id: str, event_id: str) -> Dict:
        event = db.query(Event).filter(
            Event.id == event_id,
            Event.village_id == village_id,
            Event.deleted_at.is_(None)
        ).first()
        
        if not event:
            raise NotFoundException("Event")
        
        organizer = db.query(Member).filter(Member.id == event.organizer).first()
        
        attendance = db.query(EventAttendance).filter(
            EventAttendance.event_id == event_id,
            EventAttendance.deleted_at.is_(None)
        ).all()
        
        attendance_list = []
        for a in attendance:
            member = db.query(Member).filter(Member.id == a.member_id).first()
            if member:
                attendance_list.append({
                    "member_id": str(member.id),
                    "member_name": member.full_name,
                    "member_number": member.member_number,
                    "attended": a.attended,
                    "role": a.role
                })
        
        contributions = db.query(EventContribution).filter(
            EventContribution.event_id == event_id,
            EventContribution.deleted_at.is_(None)
        ).all()
        
        contribution_list = []
        total_amount = Decimal(0)
        for c in contributions:
            member = db.query(Member).filter(Member.id == c.member_id).first()
            contrib_data = {
                "contribution_type": c.contribution_type,
                "amount": float(c.amount) if c.amount else None,
                "description": c.description
            }
            if member:
                contrib_data["member_name"] = member.full_name
            else:
                contrib_data["member_name"] = "Anonymous"
            contribution_list.append(contrib_data)
            total_amount += c.amount or 0
        
        return {
            "id": str(event.id),
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type,
            "date": event.date.isoformat(),
            "time": event.time.isoformat() if event.time else None,
            "location": event.location,
            "status": event.status,
            "organizer_name": organizer.full_name if organizer else None,
            "notes": event.notes,
            "created_at": event.created_at.isoformat(),
            "attendance": attendance_list,
            "contributions": contribution_list,
            "total_contributions": float(total_amount)
        }
    
    @staticmethod
    def create_event(db: Session, village_id: str, data: dict, current_user_id: str) -> Dict:
        # Ensure date is a date object
        event_date = data['date']
        if isinstance(event_date, str):
            event_date = date.fromisoformat(event_date)
        
        event = Event(
            village_id=village_id,
            title=data['title'],
            description=data.get('description'),
            event_type=data['event_type'],
            date=event_date,
            time=data.get('time'),
            location=data.get('location'),
            organizer=data.get('organizer'),
            notes=data.get('notes'),
            created_by=current_user_id,
            status=data.get('status', 'upcoming')
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return {"id": str(event.id), "message": f"Event '{event.title}' created"}
    
    @staticmethod
    def update_event(db: Session, village_id: str, event_id: str, data: dict) -> Dict:
        event = db.query(Event).filter(
            Event.id == event_id,
            Event.village_id == village_id,
            Event.deleted_at.is_(None)
        ).first()
        
        if not event:
            raise NotFoundException("Event")
        
        # Handle date conversion
        if 'date' in data and data['date'] is not None:
            if isinstance(data['date'], str):
                data['date'] = date.fromisoformat(data['date'])
        
        updatable_fields = ['title', 'description', 'event_type', 'date', 'time', 
                           'location', 'status', 'organizer', 'notes']
        
        for field in updatable_fields:
            if field in data and data[field] is not None:
                setattr(event, field, data[field])
        
        db.commit()
        db.refresh(event)
        
        return {"message": f"Event '{event.title}' updated"}
    
    @staticmethod
    def add_attendance(db: Session, event_id: str, member_id: str, role: Optional[str] = None) -> Dict:
        existing = db.query(EventAttendance).filter(
            EventAttendance.event_id == event_id,
            EventAttendance.member_id == member_id,
            EventAttendance.deleted_at.is_(None)
        ).first()
        
        if existing:
            existing.attended = True
            existing.check_in_time = datetime.utcnow()
            if role:
                existing.role = role
        else:
            attendance = EventAttendance(
                event_id=event_id,
                member_id=member_id,
                attended=True,
                check_in_time=datetime.utcnow(),
                role=role
            )
            db.add(attendance)
        
        db.commit()
        
        return {"message": "Attendance recorded"}
    
    @staticmethod
    def add_contribution(db: Session, event_id: str, data: dict) -> Dict:
        contribution = EventContribution(
            event_id=event_id,
            member_id=data.get('member_id'),
            contribution_type=data['contribution_type'],
            amount=data.get('amount'),
            description=data.get('description'),
            value_estimate=data.get('value_estimate'),
            recorded_by=data.get('recorded_by')
        )
        
        db.add(contribution)
        db.commit()
        db.refresh(contribution)
        
        return {"message": "Contribution recorded"}
    
    @staticmethod
    def delete_event(db: Session, village_id: str, event_id: str) -> Dict:
        event = db.query(Event).filter(
            Event.id == event_id,
            Event.village_id == village_id,
            Event.deleted_at.is_(None)
        ).first()
        
        if not event:
            raise NotFoundException("Event")
        
        event.soft_delete()
        db.commit()
        
        return {"message": f"Event '{event.title}' deleted"}

        if search:
            query = query.filter(
                Event.title.ilike(f'%{search}%') | 
                Event.description.ilike(f'%{search}%')
            )
