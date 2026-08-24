from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Notification(BaseModel):
    __tablename__ = "notifications"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False)
    member_id = Column(String(36), ForeignKey("members.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50))
    
    read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    link = Column(String(255))
    
    # Relationships
    village = relationship("Village", backref="notifications")
    member = relationship("Member", foreign_keys=[member_id])
