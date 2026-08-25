from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from datetime import timezone
import uuid
import hashlib
import secrets
from app.core.exceptions import NotFoundException, AppException
from app.models.election import Election, ElectionVoter, ElectionVote
from app.models.member import Member

class ElectionService:
    
    @staticmethod
    def generate_voter_code(member_id: str = None) -> str:
        """Generate a unique voter code"""
        prefix = "ELEC"
        part1 = secrets.token_hex(3).upper()
        part2 = secrets.token_hex(3).upper()
        return f"{prefix}-{part1}-{part2}"
    
    @staticmethod
    def create_election(db: Session, village_id: str, data: dict, current_user_id: str) -> Dict:
        election = Election(
            village_id=village_id,
            title=data['title'],
            description=data.get('description'),
            election_type=data['election_type'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            candidates=data.get('candidates', []),
            is_anonymous=data.get('is_anonymous', True),
            allow_write_in=data.get('allow_write_in', False),
            created_by=current_user_id,
            status='draft'
        )
        
        db.add(election)
        db.flush()
        
        eligible_members = db.query(Member).filter(
            Member.village_id == village_id,
            Member.is_active == True,
            Member.deleted_at.is_(None)
        ).all()
        
        for member in eligible_members:
            voter = ElectionVoter(
                election_id=election.id,
                member_id=member.id,
                voter_code=ElectionService.generate_voter_code(member.id)
            )
            db.add(voter)
        
        db.commit()
        db.refresh(election)
        
        return {
            "id": str(election.id),
            "message": f"Election '{election.title}' created",
            "voter_count": len(eligible_members)
        }
    
    @staticmethod
    def get_elections(db: Session, village_id: str, status: Optional[str] = None, search: Optional[str] = None) -> List[Dict]:
        query = db.query(Election).filter(
            Election.village_id == village_id,
            Election.deleted_at.is_(None)
        )
        if status:
            query = query.filter(Election.status == status)
        if search:
            query = query.filter(Election.title.ilike(f'%{search}%'))
        elections = query.order_by(Election.created_at.desc()).all()
        
        result = []
        for e in elections:
            voter_count = db.query(ElectionVoter).filter(
                ElectionVoter.election_id == e.id,
                ElectionVoter.deleted_at.is_(None)
            ).count()
            
            vote_count = db.query(ElectionVote).filter(
                ElectionVote.election_id == e.id,
                ElectionVote.deleted_at.is_(None)
            ).count()
            
            result.append({
                "id": str(e.id),
                "title": e.title,
                "description": e.description,
                "election_type": e.election_type,
                "status": e.status,
                "start_date": e.start_date.isoformat(),
                "end_date": e.end_date.isoformat(),
                "candidate_count": len(e.candidates or []),
                "voter_count": voter_count,
                "vote_count": vote_count,
                "created_at": e.created_at.isoformat()
            })
        
        return result
    
    @staticmethod
    def get_election(db: Session, village_id: str, election_id: str) -> Dict:
        election = db.query(Election).filter(
            Election.id == election_id,
            Election.village_id == village_id,
            Election.deleted_at.is_(None)
        ).first()
        
        if not election:
            raise NotFoundException("Election")
        
        return {
            "id": str(election.id),
            "title": election.title,
            "description": election.description,
            "election_type": election.election_type,
            "status": election.status,
            "start_date": election.start_date.isoformat(),
            "end_date": election.end_date.isoformat(),
            "candidates": election.candidates or [],
            "is_anonymous": election.is_anonymous,
            "allow_write_in": election.allow_write_in,
            "created_at": election.created_at.isoformat()
        }
    
    @staticmethod
    def update_election(db: Session, village_id: str, election_id: str, data: dict) -> Dict:
        election = db.query(Election).filter(
            Election.id == election_id,
            Election.village_id == village_id,
            Election.deleted_at.is_(None)
        ).first()
        
        if not election:
            raise NotFoundException("Election")
        
        if election.status != 'draft' and data.get('status') not in ['draft', 'finalized']:
            raise AppException("Only draft elections can be modified")
        
        updatable_fields = ['title', 'description', 'election_type', 'start_date', 
                           'end_date', 'candidates', 'is_anonymous', 'allow_write_in', 'status']
        
        for field in updatable_fields:
            if field in data and data[field] is not None:
                setattr(election, field, data[field])
        
        db.commit()
        db.refresh(election)
        
        return {"message": f"Election '{election.title}' updated"}
    
    @staticmethod
    def start_election(db: Session, village_id: str, election_id: str) -> Dict:
        from datetime import datetime
        from zoneinfo import ZoneInfo
        from datetime import timezone
        
        election = db.query(Election).filter(
            Election.id == election_id,
            Election.village_id == village_id,
            Election.deleted_at.is_(None)
        ).first()
        
        if not election:
            raise NotFoundException("Election")
        
        if election.status != 'draft':
            raise AppException("Election already started or closed")
        
        # Check if election can be started (must be between start and end time)
        if election.start_date and election.end_date:
            nairobi_tz = ZoneInfo("Africa/Nairobi")
            now = datetime.now(nairobi_tz)
            start = election.start_date.replace(tzinfo=nairobi_tz)
            end = election.end_date.replace(tzinfo=nairobi_tz)
            if now < start:
                raise AppException(f"Election starts at {start.strftime('%Y-%m-%d %H:%M')}")
            if now > end:
                raise AppException(f"Election ended at {end.strftime('%Y-%m-%d %H:%M')}")
        
        election.status = 'active'
        db.commit()
        
        return {"message": f"Election '{election.title}' is now active"}
    
    @staticmethod
    def close_election(db: Session, village_id: str, election_id: str) -> Dict:
        election = db.query(Election).filter(
            Election.id == election_id,
            Election.village_id == village_id,
            Election.deleted_at.is_(None)
        ).first()
        
        if not election:
            raise NotFoundException("Election")
        
        if election.status != 'active':
            raise AppException("Only active elections can be closed")
        
        election.status = 'closed'
        db.commit()
        
        return {"message": f"Election '{election.title}' is now closed"}
    
    @staticmethod
    def cast_vote(db: Session, voter_code: str, candidate_id: str) -> Dict:
        voter = db.query(ElectionVoter).filter(
            ElectionVoter.voter_code == voter_code,
            ElectionVoter.deleted_at.is_(None)
        ).first()
        
        if not voter:
            raise NotFoundException("Invalid voter code")
        
        if voter.has_voted:
            raise AppException("You have already voted in this election")
        
        election = db.query(Election).filter(
            Election.id == voter.election_id,
            Election.deleted_at.is_(None)
        ).first()
        
        if not election:
            raise NotFoundException("Election not found")
        
        if election.status != 'active':
            raise AppException("This election is not active")
        
        now = datetime.utcnow()
        if now < election.start_date or now > election.end_date:
            raise AppException("Election is not currently open")
        
        candidate_name = None
        for c in (election.candidates or []):
            if c.get('id') == candidate_id:
                candidate_name = c.get('name')
                break
        
        if not candidate_name:
            raise NotFoundException("Candidate not found")
        
        vote_hash = hashlib.sha256(
            f"{voter_code}{candidate_id}{election.id}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()
        
        vote = ElectionVote(
            election_id=election.id,
            voter_code=voter_code,
            candidate_id=candidate_id,
            candidate_name=candidate_name,
            vote_hash=vote_hash
        )
        db.add(vote)
        
        voter.has_voted = True
        voter.voted_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Your vote has been recorded successfully"}
    
    @staticmethod
    def get_results(db: Session, election_id: str) -> Dict:
        election = db.query(Election).filter(
            Election.id == election_id,
            Election.deleted_at.is_(None)
        ).first()
        
        if not election:
            raise NotFoundException("Election")
        
        votes = db.query(ElectionVote).filter(
            ElectionVote.election_id == election_id,
            ElectionVote.deleted_at.is_(None)
        ).all()
        
        total_votes = len(votes)
        
        # Get total voters count
        total_voters = db.query(ElectionVoter).filter(
            ElectionVoter.election_id == election_id,
            ElectionVoter.deleted_at.is_(None)
        ).count()
        
        results = {}
        for vote in votes:
            if vote.candidate_id not in results:
                results[vote.candidate_id] = {
                    "candidate_id": vote.candidate_id,
                    "candidate_name": vote.candidate_name,
                    "votes": 0
                }
            results[vote.candidate_id]["votes"] += 1
        
        sorted_results = sorted(
            results.values(),
            key=lambda x: x["votes"],
            reverse=True
        )
        
        for r in sorted_results:
            r["percentage"] = round((r["votes"] / total_votes * 100), 2) if total_votes > 0 else 0
        
        return {
            "election_id": str(election.id),
            "election_title": election.title,
            "total_votes": total_votes,
            "total_voters": total_voters,
            "turnout": round((total_votes / total_voters * 100), 2) if total_voters > 0 else 0,
            "results": sorted_results,
            "status": election.status,
            "is_anonymous": election.is_anonymous
        }
    
    @staticmethod
    def get_voter_codes(db: Session, election_id: str) -> List[Dict]:
        voters = db.query(ElectionVoter).filter(
            ElectionVoter.election_id == election_id,
            ElectionVoter.deleted_at.is_(None)
        ).all()
        
        result = []
        for v in voters:
            member = db.query(Member).filter(Member.id == v.member_id).first()
            result.append({
                "voter_code": v.voter_code,
                "member_name": member.full_name if member else "Unknown",
                "has_voted": v.has_voted,
                "voted_at": v.voted_at.isoformat() if v.voted_at else None
            })
        
        return result
    
    @staticmethod
    def generate_voter_codes(db: Session, election_id: str, count: int = None) -> Dict:
        election = db.query(Election).filter(
            Election.id == election_id,
            Election.deleted_at.is_(None)
        ).first()
        
        if not election:
            raise NotFoundException("Election")
        
        existing_voters = db.query(ElectionVoter).filter(
            ElectionVoter.election_id == election_id,
            ElectionVoter.deleted_at.is_(None)
        ).all()
        existing_member_ids = [v.member_id for v in existing_voters]
        
        eligible_members = db.query(Member).filter(
            Member.village_id == election.village_id,
            Member.is_active == True,
            Member.deleted_at.is_(None)
        ).all()
        
        new_members = [m for m in eligible_members if m.id not in existing_member_ids]
        
        if not new_members:
            return {"message": "All eligible members already have voter codes"}
        
        generated = []
        for member in new_members:
            voter_code = ElectionService.generate_voter_code(member.id)
            voter = ElectionVoter(
                election_id=election_id,
                member_id=member.id,
                voter_code=voter_code
            )
            db.add(voter)
            generated.append({
                "member_name": member.full_name,
                "voter_code": voter_code
            })
        
        db.commit()
        
        return {
            "message": f"Generated {len(generated)} voter codes",
            "generated": generated
        }
    
    @staticmethod
    def resend_voter_code(db: Session, voter_code: str) -> Dict:
        voter = db.query(ElectionVoter).filter(
            ElectionVoter.voter_code == voter_code,
            ElectionVoter.deleted_at.is_(None)
        ).first()
        
        if not voter:
            raise NotFoundException("Invalid voter code")
        
        member = db.query(Member).filter(Member.id == voter.member_id).first()
        election = db.query(Election).filter(Election.id == voter.election_id).first()
        
        if not member or not election:
            raise NotFoundException("Member or Election not found")
        
        return {
            "message": f"Voter code sent to {member.full_name}",
            "voter_code": voter_code,
            "member_name": member.full_name,
            "election_title": election.title
        }
