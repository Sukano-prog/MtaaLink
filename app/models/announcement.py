from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Announcement(BaseModel):
    __tablename__ = "announcements"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    scheduled_for = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    
    sent_via = Column(String(50), default="sms")
    status = Column(String(20), default="draft")
    
    target_groups = Column(JSON, nullable=True)
    delivery_count = Column(Integer, default=0)
    
    created_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    # Relationships
    village = relationship("Village", backref="announcements")
    creator = relationship("Member", foreign_keys=[created_by])

class AnnouncementDelivery(BaseModel):
    __tablename__ = "announcement_delivery"
    
    announcement_id = Column(String(36), ForeignKey("announcements.id"), nullable=False)
    member_id = Column(String(36), ForeignKey("members.id"), nullable=False)
    
    delivered = Column(Boolean, default=False)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Relationships
    announcement = relationship("Announcement", backref="deliveries")
    member = relationship("Member", foreign_keys=[member_id])
