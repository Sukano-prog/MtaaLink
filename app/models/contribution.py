from sqlalchemy import Column, String, DECIMAL, Date, Text, Boolean, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class ContributionType(BaseModel):
    __tablename__ = "contribution_types"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False)
    
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    color = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    category = Column(String(50), default="general")
    
    # Relationships
    village = relationship("Village", backref="contribution_types")
    
    def __repr__(self):
        return f"<ContributionType {self.name}>"

class Contribution(BaseModel):
    __tablename__ = "contributions"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False)
    member_id = Column(String(36), ForeignKey("members.id"), nullable=False)
    contribution_type_id = Column(String(36), ForeignKey("contribution_types.id"), nullable=True)
    
    amount = Column(DECIMAL(12, 2), nullable=False)
    paid_amount = Column(DECIMAL(12, 2), default=0)
    balance = Column(DECIMAL(12, 2), default=0)
    
    due_date = Column(Date, nullable=True)
    status = Column(String(20), default="pending")
    
    payment_method = Column(String(50), nullable=True)
    payment_reference = Column(String(255), nullable=True)
    receipt_number = Column(String(50), unique=True, nullable=True)
    notes = Column(Text, nullable=True)
    
    recorded_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    # Relationships
    village = relationship("Village", backref="contributions")
    member = relationship("Member", foreign_keys=[member_id])
    contribution_type = relationship("ContributionType")
    recorder = relationship("Member", foreign_keys=[recorded_by])
    
    def __repr__(self):
        return f"<Contribution {self.amount} by {self.member_id}>"

class ContributionCampaign(BaseModel):
    __tablename__ = "contribution_campaigns"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False)
    contribution_type_id = Column(String(36), ForeignKey("contribution_types.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_amount = Column(DECIMAL(12, 2), nullable=False)
    collected_amount = Column(DECIMAL(12, 2), default=0)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    status = Column(String(20), default="active")
    
    created_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    # Relationships
    village = relationship("Village", backref="contribution_campaigns")
    contribution_type = relationship("ContributionType")
    creator = relationship("Member", foreign_keys=[created_by])
