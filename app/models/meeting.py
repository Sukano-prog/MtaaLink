from sqlalchemy import Column, String, Boolean, DateTime, Date, Time, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import BaseModel

class Meeting(BaseModel):
    __tablename__ = "meetings"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=True)
    location = Column(String(255), nullable=True)
    
    meeting_type = Column(String(50), default="general")
    category = Column(String(50), nullable=True)
    meeting_number = Column(Integer, nullable=True)
    
    agenda = Column(Text, nullable=True)
    minutes = Column(Text, nullable=True)
    minutes_approved = Column(Boolean, default=False)
    minutes_approved_at = Column(DateTime, nullable=True)
    minutes_approved_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    quorum_required = Column(Integer, default=10)
    quorum_met = Column(Boolean, default=False)
    total_attended = Column(Integer, default=0)
    
    status = Column(String(20), default="scheduled")
    
    chairperson_id = Column(String(36), ForeignKey("members.id"), nullable=True)
    secretary_id = Column(String(36), ForeignKey("members.id"), nullable=True)
    created_by = Column(String(36), ForeignKey("members.id"), nullable=False)
    
    is_archived = Column(Boolean, default=False)
    archived_at = Column(DateTime, nullable=True)
    archived_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    # Relationships
    village = relationship("Village", foreign_keys=[village_id], backref="meetings")
    chairperson = relationship("Member", foreign_keys=[chairperson_id])
    secretary = relationship("Member", foreign_keys=[secretary_id])
    creator = relationship("Member", foreign_keys=[created_by])
    minutes_approver = relationship("Member", foreign_keys=[minutes_approved_by])
    
    def __repr__(self):
        return f"<Meeting {self.title}>"

class MeetingAttendance(BaseModel):
    __tablename__ = "meeting_attendance"
    
    meeting_id = Column(String(36), ForeignKey("meetings.id"), nullable=False)
    member_id = Column(String(36), ForeignKey("members.id"), nullable=False)
    
    attended = Column(Boolean, default=False)
    attendance_type = Column(String(20), default="present")
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    
    proxy_for = Column(String(36), ForeignKey("members.id"), nullable=True)
    proxy_count = Column(Integer, default=0)
    
    # Relationships
    meeting = relationship("Meeting", foreign_keys=[meeting_id], backref="attendance")
    member = relationship("Member", foreign_keys=[member_id])
    proxy_member = relationship("Member", foreign_keys=[proxy_for])

class MeetingActionItem(BaseModel):
    __tablename__ = "meeting_action_items"
    
    meeting_id = Column(String(36), ForeignKey("meetings.id"), nullable=False)
    
    description = Column(Text, nullable=False)
    assigned_to = Column(String(36), ForeignKey("members.id"), nullable=False)
    due_date = Column(Date, nullable=True)
    
    priority = Column(String(20), default="medium")
    status = Column(String(20), default="pending")
    
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    meeting = relationship("Meeting", foreign_keys=[meeting_id], backref="action_items")
    assignee = relationship("Member", foreign_keys=[assigned_to])

class MeetingMotion(BaseModel):
    __tablename__ = "meeting_motions"
    
    meeting_id = Column(String(36), ForeignKey("meetings.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    proposed_by = Column(String(36), ForeignKey("members.id"), nullable=False)
    seconded_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    status = Column(String(20), default="proposed")
    votes_for = Column(Integer, default=0)
    votes_against = Column(Integer, default=0)
    votes_abstain = Column(Integer, default=0)
    
    passed = Column(Boolean, default=False)
    voted_at = Column(DateTime, nullable=True)
    
    # Relationships
    meeting = relationship("Meeting", foreign_keys=[meeting_id], backref="motions")
    proposer = relationship("Member", foreign_keys=[proposed_by])
    seconder = relationship("Member", foreign_keys=[seconded_by])

class MeetingMinutesLive(BaseModel):
    __tablename__ = "meeting_minutes_live"
    
    meeting_id = Column(String(36), ForeignKey("meetings.id"), nullable=False)
    
    # Live minutes content
    content = Column(Text, nullable=False)
    
    # Track which agenda item this belongs to
    agenda_item = Column(String(255), nullable=True)
    
    # Who recorded this
    recorded_by = Column(String(36), ForeignKey("members.id"), nullable=False)
    
    # Timestamp of when this was recorded
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Whether this is the latest version
    is_latest = Column(Boolean, default=True)
    
    # Relationships
    meeting = relationship("Meeting", backref="live_minutes")
    recorder = relationship("Member", foreign_keys=[recorded_by])
