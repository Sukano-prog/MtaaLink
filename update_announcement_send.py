import re

with open('/home/laki/MtaaLink/app/api/v1/announcements.py', 'r') as f:
    content = f.read()

# Find the send_announcement function and update it
old = '''async def send_announcement(
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
        
        # Mark as sent
        announcement.status = 'sent'
        announcement.sent_at = datetime.utcnow()
        
        # Mark all deliveries as delivered
        deliveries = db.query(AnnouncementDelivery).filter(
            AnnouncementDelivery.announcement_id == announcement_id,
            AnnouncementDelivery.deleted_at.is_(None)
        ).all()
        
        delivered_count = 0
        for d in deliveries:
            d.delivered = True
            d.delivered_at = datetime.utcnow()
            delivered_count += 1
        
        db.commit()
        
        return {"message": f"Announcement sent to {delivered_count} members"}'''

new = '''async def send_announcement(
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
        
        for member in members:
            if member.phone:
                result = SMSService.send_sms(
                    member.phone,
                    f"MtaaLink: {announcement.title}\\n\\n{announcement.message}"
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
        
        return {"message": f"Announcement sent to {sent_count} members (failed: {failed_count})"}'''

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/app/api/v1/announcements.py', 'w') as f:
        f.write(content)
    print("✅ Announcement SMS sending updated")
else:
    print("❌ Pattern not found")
