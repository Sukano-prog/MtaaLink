from sqlalchemy import Column, String, Text, DateTime, Date, DECIMAL, Boolean, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import BaseModel

class Expense(BaseModel):
    __tablename__ = "expenses"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False)
    
    description = Column(Text, nullable=False)
    amount = Column(DECIMAL(12, 2), nullable=False)
    
    category = Column(String(50), nullable=False)
    # categories: water, infrastructure, events, meetings, health, education, emergency, transport, other
    
    expense_date = Column(Date, nullable=False)
    payment_method = Column(String(50), nullable=True)
    # payment_method: cash, mpesa, bank, till
    
    receipt_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    recorded_by = Column(String(36), ForeignKey("members.id"), nullable=False)
    approved_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    # Optional links to projects or events
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=True)
    meeting_id = Column(String(36), ForeignKey("meetings.id"), nullable=True)
    
    # Relationships - use unique backref names
    village = relationship("Village", backref="village_expenses")
    recorder = relationship("Member", foreign_keys=[recorded_by])
    approver = relationship("Member", foreign_keys=[approved_by])
    project = relationship("Project", backref="project_expenses")
    event = relationship("Event", backref="event_expenses")
    meeting = relationship("Meeting", backref="meeting_expenses")

class ExpenseCategory(BaseModel):
    __tablename__ = "expense_categories"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False)
    
    name = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    # Relationships
    village = relationship("Village", backref="expense_categories")
    creator = relationship("Member", foreign_keys=[created_by])
