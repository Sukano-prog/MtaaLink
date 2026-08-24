from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.core.exceptions import AppException
from app.models.member import Member
from app.models.announcement import Announcement, AnnouncementDelivery
from app.schemas.announcement import AnnouncementCreate, AnnouncementResponse

router = APIRouter(tags=["Announcements"])

@router.get("/api/v1/announcements")
@router.get("/api/v1/announcements/")
async def get_announcements(
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Announcement).filter(
            Announcement.village_id == current_user.village_id,
            Announcement.deleted_at.is_(None)
        )
        if status:
            query = query.filter(Announcement.status == status)
        if search:
            query = query.filter(
                Announcement.title.ilike(f'%{search}%') |
                Announcement.message.ilike(f'%{search}%')
            )
        announcements = query.order_by(Announcement.created_at.desc()).all()
        
        result = []
        for a in announcements:
            creator = db.query(Member).filter(Member.id == a.created_by).first()
            
            # Get delivery count
            delivery_count = db.query(AnnouncementDelivery).filter(
                AnnouncementDelivery.announcement_id == a.id,
                AnnouncementDelivery.deleted_at.is_(None)
            ).count()
            
            result.append({
                "id": str(a.id),
                "title": a.title,
                "message": a.message,
                "status": a.status,
                "sent_via": a.sent_via,
                "scheduled_for": a.scheduled_for.isoformat() if a.scheduled_for else None,
                "sent_at": a.sent_at.isoformat() if a.sent_at else None,
                "delivery_count": delivery_count,
                "created_by": creator.full_name if creator else "Unknown",
                "created_at": a.created_at.isoformat() if a.created_at else None
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/v1/announcements/{announcement_id}")
@router.get("/api/v1/announcements/{announcement_id}/")
async def get_announcement(
    announcement_id: str,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        announcement = db.query(Announcement).filter(
            Announcement.id == announcement_id,
            Announcement.village_id == current_user.village_id,
            Announcement.deleted_at.is_(None)
        ).first()
        
        if not announcement:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        creator = db.query(Member).filter(Member.id == announcement.created_by).first()
        
        # Get deliveries
        deliveries = db.query(AnnouncementDelivery).filter(
            AnnouncementDelivery.announcement_id == announcement_id,
            AnnouncementDelivery.deleted_at.is_(None)
        ).all()
        
        delivery_list = []
        for d in deliveries:
            member = db.query(Member).filter(Member.id == d.member_id).first()
            delivery_list.append({
                "id": str(d.id),
                "member_id": str(d.member_id),
                "member_name": member.full_name if member else "Unknown",
                "delivered": d.delivered,
                "delivered_at": d.delivered_at.isoformat() if d.delivered_at else None,
                "read_at": d.read_at.isoformat() if d.read_at else None,
                "error_message": d.error_message
            })
        
        return {
            "id": str(announcement.id),
            "title": announcement.title,
            "message": announcement.message,
            "status": announcement.status,
            "sent_via": announcement.sent_via,
            "scheduled_for": announcement.scheduled_for.isoformat() if announcement.scheduled_for else None,
            "sent_at": announcement.sent_at.isoformat() if announcement.sent_at else None,
            "delivery_count": len(deliveries),
            "created_by": creator.full_name if creator else "Unknown",
            "created_at": announcement.created_at.isoformat() if announcement.created_at else None,
            "deliveries": delivery_list
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/v1/announcements")
@router.post("/api/v1/announcements/")
async def create_announcement(
    data: AnnouncementCreate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        # Get all members in the village
        members = db.query(Member).filter(
            Member.village_id == current_user.village_id,
            Member.is_active == True,
            Member.deleted_at.is_(None)
        ).all()
        
        announcement = Announcement(
            village_id=current_user.village_id,
            title=data.title,
            message=data.message,
            sent_via=data.sent_via,
            scheduled_for=data.scheduled_for,
            target_groups=data.target_groups,
            created_by=current_user.id,
            status='draft' if not data.scheduled_for else 'scheduled'
        )
        
        db.add(announcement)
        db.flush()
        
        # Create delivery records for all members
        # Get village name
        village_name = SMSService.get_village_name(db, current_user.village_id)
        
        for member in members:
            delivery = AnnouncementDelivery(
                announcement_id=announcement.id,
                member_id=member.id,
                delivered=False
            )
            db.add(delivery)
        
        db.commit()
        db.refresh(announcement)
        
        return {
            "id": str(announcement.id),
            "message": f"Announcement '{announcement.title}' created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/api/v1/announcements/{announcement_id}")
@router.put("/api/v1/announcements/{announcement_id}/")
async def update_announcement(
    announcement_id: str,
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        announcement = db.query(Announcement).filter(
            Announcement.id == announcement_id,
            Announcement.village_id == current_user.village_id,
            Announcement.deleted_at.is_(None)
        ).first()
        
        if not announcement:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        # Only allow updates if status is draft
        if announcement.status not in ['draft', 'scheduled']:
            raise HTTPException(status_code=400, detail="Only draft or scheduled announcements can be edited")
        
        # Update fields with datetime handling
        if 'title' in data and data['title'] is not None:
            announcement.title = data['title']
        if 'message' in data and data['message'] is not None:
            announcement.message = data['message']
        if 'sent_via' in data and data['sent_via'] is not None:
            announcement.sent_via = data['sent_via']
        if 'scheduled_for' in data:
            if data['scheduled_for']:
                from datetime import datetime
                if isinstance(data['scheduled_for'], str):
                    # Handle ISO format with Z
                    announcement.scheduled_for = datetime.fromisoformat(data['scheduled_for'].replace('Z', '+00:00'))
                else:
                    announcement.scheduled_for = data['scheduled_for']
            else:
                announcement.scheduled_for = None
        
        db.commit()
        db.refresh(announcement)
        
        return {"message": f"Announcement '{announcement.title}' updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/v1/announcements/{announcement_id}/send")
@router.post("/api/v1/announcements/{announcement_id}/send/")
async def send_announcement(
    announcement_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        announcement = db.query(Announcement).filter(
            Announcement.id == announcement_id,
            Announcement.village_id == current_user.village_id,
            Announcement.deleted_at.is_(None)
        ).first()
        
        if not announcement:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        if announcement.status == 'sent':
            raise HTTPException(status_code=400, detail="Announcement already sent")
        
        # Get all members with phone numbers
        members = db.query(Member).filter(
            Member.village_id == current_user.village_id,
            Member.phone.isnot(None),
            Member.deleted_at.is_(None)
        ).all()
        
        # Send SMS to each member
        sent_count = 0
        failed_count = 0
        
        # Get village name
        village_name = SMSService.get_village_name(db, current_user.village_id)
        
        for member in members:
            if member.phone:
                # Send based on sent_via
                if announcement.sent_via == 'whatsapp':
                    result = WhatsAppService.send_announcement(
                        member.phone,
                        announcement.title,
                        announcement.message
                    )
                elif announcement.sent_via == 'both':
                    # Send both SMS and WhatsApp
                    result_sms = SMSService.send_sms(
                        member.phone,
                        f"{village_name}: {announcement.title}\n\n{announcement.message}"
                    )
                    result_whatsapp = WhatsAppService.send_announcement(
                        member.phone,
                        announcement.title,
                        announcement.message
                    )
                    result = result_sms if result_sms.get('success') else result_whatsapp
                else:
                    # Default to SMS
                    result = SMSService.send_sms(
                        member.phone,
                        f"{village_name}: {announcement.title}\n\n{announcement.message}"
                    )
                
                if result.get('success'):
                    sent_count += 1
                else:
                    failed_count += 1
        
        # Mark as sent
        announcement.status = 'sent'
        announcement.sent_at = datetime.utcnow()
        announcement.delivery_count = sent_count
        
        # Mark deliveries
        deliveries = db.query(AnnouncementDelivery).filter(
            AnnouncementDelivery.announcement_id == announcement_id,
            AnnouncementDelivery.deleted_at.is_(None)
        ).all()
        
        for d in deliveries:
            d.delivered = True
            d.delivered_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": f"Announcement sent to {sent_count} members (failed: {failed_count})"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/v1/announcements/{announcement_id}")
@router.delete("/api/v1/announcements/{announcement_id}/")
async def delete_announcement(
    announcement_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        announcement = db.query(Announcement).filter(
            Announcement.id == announcement_id,
            Announcement.village_id == current_user.village_id,
            Announcement.deleted_at.is_(None)
        ).first()
        
        if not announcement:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        # Only allow deletion if status is draft or scheduled
        if announcement.status not in ['draft', 'scheduled']:
            raise HTTPException(status_code=400, detail="Only draft or scheduled announcements can be deleted")
        
        from datetime import datetime
        announcement.deleted_at = datetime.utcnow()
        db.commit()
        
        return {"message": f"Announcement '{announcement.title}' deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Import SMS service for sending announcements
from app.services.sms_service import SMSService

# Import WhatsApp service
from app.services.whatsapp_service import WhatsAppService
