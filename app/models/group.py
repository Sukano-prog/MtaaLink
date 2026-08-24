from sqlalchemy import Column, String, Boolean, Text, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Group(BaseModel):
    __tablename__ = "groups"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False)
    
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    
    created_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    # Relationships - specify foreign_keys explicitly
    village = relationship("Village", foreign_keys=[village_id], backref="groups")
    creator = relationship("Member", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<Group {self.name}>"

class GroupMember(BaseModel):
    __tablename__ = "group_members"
    
    group_id = Column(String(36), ForeignKey("groups.id"), nullable=False)
    member_id = Column(String(36), ForeignKey("members.id"), nullable=False)
    
    # Relationships - specify foreign_keys explicitly
    group = relationship("Group", foreign_keys=[group_id], backref="group_members")
    member = relationship("Member", foreign_keys=[member_id], backref="group_memberships")
    
    __table_args__ = (UniqueConstraint('group_id', 'member_id', name='unique_group_member'),)
