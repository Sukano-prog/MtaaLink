from sqlalchemy import Column, String, Text, DateTime, Date, DECIMAL, Boolean, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import BaseModel

class Event(BaseModel):
    __tablename__ = "events"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(String(50), nullable=False)
    # event_type: funeral, wedding, harambee, community_work, church, other
    
    date = Column(Date, nullable=False)
    time = Column(DateTime, nullable=True)
    location = Column(String(255), nullable=True)
    
    status = Column(String(20), default="upcoming")
    # status: upcoming, ongoing, completed, cancelled
    
    organizer = Column(String(36), ForeignKey("members.id"), nullable=True)
    created_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    notes = Column(Text, nullable=True)
    
    # Relationships
    village = relationship("Village", backref="events")
    organizer_member = relationship("Member", foreign_keys=[organizer])
    creator = relationship("Member", foreign_keys=[created_by])

class EventAttendance(BaseModel):
    __tablename__ = "event_attendance"
    
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    member_id = Column(String(36), ForeignKey("members.id"), nullable=False)
    
    attended = Column(Boolean, default=True)
    check_in_time = Column(DateTime, nullable=True)
    role = Column(String(50), nullable=True)  # e.g., organizer, volunteer, guest, elder
    
    # Relationships
    event = relationship("Event", backref="attendance")
    member = relationship("Member", foreign_keys=[member_id])

class EventContribution(BaseModel):
    __tablename__ = "event_contributions"
    
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    member_id = Column(String(36), ForeignKey("members.id"), nullable=True)
    contribution_type = Column(String(50), nullable=False)
    # contribution_type: money, food, materials, transport, other
    
    amount = Column(DECIMAL(12, 2), nullable=True)  # For money contributions
    description = Column(Text, nullable=True)  # For food/materials description
    value_estimate = Column(DECIMAL(12, 2), nullable=True)  # Estimated value
    
    recorded_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    event = relationship("Event", backref="contributions")
    member = relationship("Member", foreign_keys=[member_id])
    recorder = relationship("Member", foreign_keys=[recorded_by])

class EventExpense(BaseModel):
    __tablename__ = "event_expenses"
    
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    
    description = Column(Text, nullable=False)
    amount = Column(DECIMAL(12, 2), nullable=False)
    paid_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    paid_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    event = relationship("Event", backref="expenses")
    payer = relationship("Member", foreign_keys=[paid_by])
