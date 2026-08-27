from sqlalchemy import Column, String, Text, DateTime, Date, DECIMAL, Boolean, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import BaseModel

class Project(BaseModel):
    __tablename__ = "projects"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    status = Column(String(50), default="planning")
    # status options: planning, ongoing, completed, on_hold, cancelled
    
    priority = Column(String(20), default="medium")
    
    budget = Column(DECIMAL(12, 2), default=0)
    amount_spent = Column(DECIMAL(12, 2), default=0)
    
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    expected_completion = Column(Date, nullable=True)
    
    project_lead = Column(String(36), ForeignKey("members.id"), nullable=True)
    created_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    meeting_id = Column(String(36), ForeignKey("meetings.id"), nullable=True)
    
    # Auto-calculated progress
    progress = Column(Integer, default=0)  # 0-100 percentage
    
    # Relationships
    village = relationship("Village", backref="projects")
    lead = relationship("Member", foreign_keys=[project_lead])
    creator = relationship("Member", foreign_keys=[created_by])
    meeting = relationship("Meeting", foreign_keys=[meeting_id])

class ProjectMilestone(BaseModel):
    __tablename__ = "project_milestones"
    
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Weight for progress calculation (0-100)
    weight = Column(Integer, default=0)
    
    status = Column(String(20), default="pending")
    # status options: pending, in_progress, completed
    
    order = Column(Integer, default=0)
    
    # Relationships
    project = relationship("Project", backref="milestones")

class ProjectTask(BaseModel):
    __tablename__ = "project_tasks"
    
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    milestone_id = Column(String(36), ForeignKey("project_milestones.id"), nullable=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assigned_to = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    due_date = Column(Date, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="pending")
    # status options: pending, in_progress, completed
    
    priority = Column(String(20), default="medium")
    
    # Relationships
    project = relationship("Project", backref="tasks")
    milestone = relationship("ProjectMilestone", backref="tasks")
    assignee = relationship("Member", foreign_keys=[assigned_to])

class ProjectContribution(BaseModel):
    __tablename__ = "project_contributions"
    
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    contribution_id = Column(String(36), ForeignKey("contributions.id"), nullable=False)
    
    amount = Column(DECIMAL(12, 2), nullable=False)
    allocated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", backref="project_contributions")
    contribution = relationship("Contribution", backref="project_allocations")
