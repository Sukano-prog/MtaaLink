from sqlalchemy import Column, String, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Member(BaseModel):
    __tablename__ = "members"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False)
    group_id = Column(String(36), ForeignKey("groups.id"), nullable=True)
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False, unique=True)
    email = Column(String(255), nullable=True)
    
    # Unique Member Identifier
    member_number = Column(String(50), unique=True, nullable=False, index=True)
    id_number = Column(String(50), nullable=True)
    
    role = Column(String(50), default="member")
    custom_role = Column(String(50), nullable=True)
    gender = Column(String(10), nullable=True)
    age_category = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    custom_field = Column(String(255), nullable=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    password_hash = Column(String(255), nullable=False)
    
    # Relationships
    village = relationship("Village", foreign_keys=[village_id], backref="members")
    group = relationship("Group", foreign_keys=[group_id], backref="members")
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name_reverse(self) -> str:
        return f"{self.last_name}, {self.first_name}"
    
    def __repr__(self):
        return f"<Member {self.member_number}: {self.full_name}>"
