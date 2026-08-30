from sqlalchemy import Column, String, Boolean, DateTime, DECIMAL, Integer, JSON
from app.models.base import BaseModel

class Village(BaseModel):
    __tablename__ = "villages"
    
    name = Column(String(255), nullable=False)
    county = Column(String(100))
    ward = Column(String(100))
    admin_email = Column(String(255), unique=True, nullable=False)
    admin_phone = Column(String(20))
    
    is_verified = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    subscription_status = Column(String(20), default="trial")
    subscription_ends = Column(DateTime, nullable=True)
    trial_ends = Column(DateTime, nullable=True)
    
    budget = Column(DECIMAL(12, 2), default=0)
    sms_balance = Column(Integer, default=0)
    max_members = Column(Integer, default=100)
    
    language = Column(String(10), default="sw")
    currency = Column(String(10), default="KES")
    
    settings = Column(JSON, default={})
    
    def __repr__(self):
        return f"<Village {self.name}>"
