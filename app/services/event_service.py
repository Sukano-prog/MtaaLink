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

        if not events:
            return []

        # N+1 FIX: Pre-load organizers, attendance counts, and contributions in bulk
        from sqlalchemy import func

        event_ids = [e.id for e in events]
        organizer_ids = list({e.organizer for e in events if e.organizer})

        organizers_map = {
            m.id: m for m in db.query(Member).filter(Member.id.in_(organizer_ids)).all()
        } if organizer_ids else {}

        attendance_counts = dict(
            db.query(EventAttendance.event_id, func.count(EventAttendance.id))
            .filter(
                EventAttendance.event_id.in_(event_ids),
                EventAttendance.deleted_at.is_(None)
            )
            .group_by(EventAttendance.event_id)
            .all()
        )

        all_contribs = db.query(EventContribution).filter(
            EventContribution.event_id.in_(event_ids),
            EventContribution.deleted_at.is_(None)
        ).all()

        contribs_by_event = {}
        for c in all_contribs:
            contribs_by_event.setdefault(c.event_id, []).append(c)

        result = []
        for e in events:
            organizer = organizers_map.get(e.organizer)
            contributions = contribs_by_event.get(e.id, [])
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
                "attendance_count": attendance_counts.get(e.id, 0),
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

        # N+1 FIX: Pre-load all member details in ONE query
        # (only needed for non-visitor attendance records)
        member_ids = list({a.member_id for a in attendance if a.member_id and not a.is_visitor})
        members_map = {
            m.id: m for m in db.query(Member).filter(Member.id.in_(member_ids)).all()
        } if member_ids else {}

        attendance_list = []
        for a in attendance:
            if a.is_visitor:
                attendance_list.append({
                    "record_id": str(a.id),
                    "member_id": None,
                    "member_name": a.member_name or "Visitor",
                    "member_number": None,
                    "attended": a.attended,
                    "role": a.role,
                    "is_visitor": True,
                    "member_gender": a.member_gender,
                    "member_age_category": a.member_age_category,
                    "phone": a.member_phone or "-",
                    "custom_field": "-"
                })
            else:
                member = members_map.get(a.member_id)
                if member:
                    attendance_list.append({
                        "record_id": str(a.id),
                        "member_id": str(member.id),
                        "member_name": member.full_name,
                        "member_number": member.member_number,
                        "attended": a.attended,
                        "role": a.role,
                        "is_visitor": False,
                        "member_gender": member.gender,
                        "member_age_category": member.age_category,
                        "phone": member.phone or '-',
                        "custom_field": member.custom_field or "-"
                    })

        contributions = db.query(EventContribution).filter(
            EventContribution.event_id == event_id,
            EventContribution.deleted_at.is_(None)
        ).all()

        # N+1 FIX: Pre-load all contributing members in ONE query
        contrib_member_ids = list({c.member_id for c in contributions if c.member_id})
        contrib_members_map = {
            m.id: m for m in db.query(Member).filter(Member.id.in_(contrib_member_ids)).all()
        } if contrib_member_ids else {}

        contribution_list = []
        total_amount = Decimal(0)
        for c in contributions:
            member = contrib_members_map.get(c.member_id)
            contrib_data = {
                "contribution_type": c.contribution_type,
                "amount": float(c.amount) if c.amount else None,
                "description": c.description,
                "payment_date": c.payment_date.strftime('%Y-%m-%d') if hasattr(c, 'payment_date') and c.payment_date else None,
                "payment_method": c.payment_method if hasattr(c, 'payment_method') else None,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "member_phone": member.phone if member else (c.member_phone if hasattr(c, "member_phone") and c.member_phone else None),
                "member_age_category": member.age_category if member else None,
                "member_custom_field": member.custom_field if member else None
            }
            if member:
                contrib_data["member_name"] = member.full_name
            elif c.member_name:
                contrib_data["member_name"] = c.member_name
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
        from app.models.member import Member

        member = db.query(Member).filter(Member.id == member_id).first()
        member_name = member.full_name if member else None
        member_gender = member.gender if member else None
        member_age_category = member.age_category if member else None
        member_phone = member.phone if member else None

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
            if member_name:
                existing.member_name = member_name
            if member_gender:
                existing.member_gender = member_gender
            if member_age_category:
                existing.member_age_category = member_age_category
            if member_phone:
                existing.member_phone = member_phone
        else:
            attendance = EventAttendance(
                event_id=event_id,
                member_id=member_id,
                attended=True,
                check_in_time=datetime.utcnow(),
                role=role,
                member_name=member_name,
                member_gender=member_gender,
                member_age_category=member_age_category
            )
            db.add(attendance)

        db.commit()

        return {"message": "Attendance recorded"}

    @staticmethod
    def add_contribution(db: Session, event_id: str, data: dict) -> Dict:
        from app.models.member import Member

        member_name = None
        if data.get('member_id'):
            member = db.query(Member).filter(Member.id == data['member_id']).first()
            if member:
                member_name = member.full_name
        elif data.get('member_name'):
            member_name = data.get('member_name')
        else:
            member_name = 'Visitor'

        contribution = EventContribution(
            event_id=event_id,
            member_id=data.get('member_id'),
            member_name=member_name,
            member_phone=data.get('member_phone'),
            contribution_type=data['contribution_type'],
            amount=data.get('amount'),
            description=data.get('description'),
            value_estimate=data.get('value_estimate'),
            recorded_by=data.get('recorded_by')
        )

        db.add(contribution)
        db.commit()
        db.refresh(contribution)

        return {"message": "Contribution recorded", "member_name": member_name}

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
