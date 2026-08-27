from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class AuditLog(BaseModel):
    __tablename__ = "audit_logs"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False, index=True)
    member_id = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    action = Column(String(50), nullable=False)
    table_name = Column(String(50), nullable=True)
    record_id = Column(String(36), nullable=True)
    
    old_data = Column(JSON, nullable=True)
    new_data = Column(JSON, nullable=True)
    
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    session_id = Column(String(100), nullable=True)
    
    security_event_type = Column(String(50), nullable=True)
    security_severity = Column(String(20), nullable=True)
    
    # Relationships
    village = relationship("Village", backref="audit_logs")
    member = relationship("Member", foreign_keys=[member_id])
