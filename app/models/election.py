from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.models.base import BaseModel

class Election(BaseModel):
    __tablename__ = "elections"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    election_type = Column(String(50), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="draft")
    candidates = Column(JSON, default=[])
    is_anonymous = Column(Boolean, default=True)
    allow_write_in = Column(Boolean, default=False)
    created_by = Column(String(36), ForeignKey("members.id"), nullable=True)
    
    village = relationship("Village", backref="elections")
    creator = relationship("Member", foreign_keys=[created_by])

class ElectionVoter(BaseModel):
    __tablename__ = "election_voters"
    
    election_id = Column(String(36), ForeignKey("elections.id"), nullable=False)
    member_id = Column(String(36), ForeignKey("members.id"), nullable=True)
    voter_code = Column(String(50), unique=True, nullable=False)
    has_voted = Column(Boolean, default=False)
    voted_at = Column(DateTime, nullable=True)
    
    election = relationship("Election", backref="voters")
    member = relationship("Member", foreign_keys=[member_id])

class ElectionVote(BaseModel):
    __tablename__ = "election_votes"
    
    election_id = Column(String(36), ForeignKey("elections.id"), nullable=False)
    voter_code = Column(String(50), nullable=False)
    candidate_id = Column(String(50), nullable=False)
    candidate_name = Column(String(255), nullable=False)
    vote_hash = Column(String(255), nullable=False)
    
    election = relationship("Election", backref="votes")
