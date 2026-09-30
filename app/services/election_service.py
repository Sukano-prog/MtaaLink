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
from app.services.sms_service import SMSService


def _build_voter_code_sms(election, org_name: str, voter_code: str) -> str:
    """Build the full voter code SMS with all relevant info."""
    from zoneinfo import ZoneInfo

    parts = []
    if org_name:
        parts.append(f"{org_name}:")

    election_title = election.title or "Election"
    parts.append(f'Your voter code for "{election_title}" is {voter_code}.')

    if election.end_date:
        nairobi = ZoneInfo("Africa/Nairobi")
        try:
            deadline = election.end_date.astimezone(nairobi).strftime("%d %b, %I:%M %p")
            parts.append(f"Vote by {deadline}: mtaalink.org/vote?code={voter_code}")
        except Exception:
            parts.append(f"Vote at mtaalink.org/vote?code={voter_code}")
    else:
        parts.append(f"Vote at mtaalink.org/vote?code={voter_code}")

    message = " ".join(parts)
    if len(message) > 300:
        message = f'{org_name}: Your voter code for "{election_title}" is {voter_code}. Vote at mtaalink.org/vote?code={voter_code}'
    return message


class ElectionService:

    @staticmethod
    def generate_voter_code(member_id: str = None) -> str:
        """Generate a unique voter code"""
        prefix = "ELEC"
        part1 = secrets.token_hex(3).upper()
        part2 = secrets.token_hex(3).upper()
        return f"{prefix}-{part1}-{part2}"

    @staticmethod
    @staticmethod
    def create_election(db: Session, village_id: str, data: dict, current_user_id: str) -> Dict:
        """Create an election, generate voter codes, and SMS each eligible member."""
        from app.models.village import Village

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
            status=data.get('status') or 'draft',
        )

        db.add(election)
        db.flush()

        # Look up village name ONCE for SMS org prefix
        village = db.query(Village).filter(Village.id == village_id).first()
        org_name = village.name if village else "MtaaLink"

        eligible_members = db.query(Member).filter(
            Member.village_id == village_id,
            Member.is_active == True,
            Member.deleted_at.is_(None),
        ).all()

        generated = []
        for member in eligible_members:
            voter_code = ElectionService.generate_voter_code(member.id)
            voter = ElectionVoter(
                election_id=election.id,
                member_id=member.id,
                voter_code=voter_code,
            )
            db.add(voter)
            db.flush()  # get voter.id if needed downstream

            sms_result = {"success": False, "error": "No phone number"}
            if member.phone:
                message = _build_voter_code_sms(election, org_name, voter_code)
                sms_result = SMSService.send_sms(
                    to_phone=member.phone,
                    message=message,
                    sms_type="transactional",
                )

            generated.append({
                "member_name": member.full_name,
                "member_phone": member.phone,
                "voter_code": voter_code,
                "sms_sent": sms_result.get("success", False),
                "sms_error": sms_result.get("error") if not sms_result.get("success") else None,
                "provider": sms_result.get("provider"),
            })

        db.commit()
        db.refresh(election)

        sent_count = sum(1 for g in generated if g["sms_sent"])

        return {
            "id": str(election.id),
            "message": f"Election '{election.title}' created. "
                       f"SMS sent to {sent_count}/{len(generated)} members.",
            "voter_count": len(eligible_members),
            "sms_sent": sent_count,
            "generated": generated,
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

        if not elections:
            return []

        # N+1 FIX: Pre-load voter counts and vote counts in 2 queries
        from sqlalchemy import func

        election_ids = [e.id for e in elections]

        voter_counts = dict(
            db.query(ElectionVoter.election_id, func.count(ElectionVoter.id))
            .filter(
                ElectionVoter.election_id.in_(election_ids),
                ElectionVoter.deleted_at.is_(None)
            )
            .group_by(ElectionVoter.election_id)
            .all()
        )

        vote_counts = dict(
            db.query(ElectionVote.election_id, func.count(ElectionVote.id))
            .filter(
                ElectionVote.election_id.in_(election_ids),
                ElectionVote.deleted_at.is_(None)
            )
            .group_by(ElectionVote.election_id)
            .all()
        )

        result = []
        for e in elections:
            result.append({
                "id": str(e.id),
                "title": e.title,
                "description": e.description,
                "election_type": e.election_type,
                "status": e.status,
                "start_date": e.start_date.isoformat(),
                "end_date": e.end_date.isoformat(),
                "candidate_count": len(e.candidates or []),
                "voter_count": voter_counts.get(e.id, 0),
                "vote_count": vote_counts.get(e.id, 0),
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
        election = db.query(Election).filter(
            Election.id == election_id,
            Election.village_id == village_id,
            Election.deleted_at.is_(None)
        ).first()

        if not election:
            raise NotFoundException("Election")

        if election.status != 'draft':
            raise AppException("Election already started or closed")

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

        nairobi_tz = ZoneInfo("Africa/Nairobi")
        now = datetime.now(nairobi_tz)
        start = election.start_date.replace(tzinfo=nairobi_tz)
        end = election.end_date.replace(tzinfo=nairobi_tz)
        if now < start or now > end:
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
    def get_vote_info(db: Session, voter_code: str) -> Dict:
        """Public: validate a voter code and return election + candidates."""
        from app.models.village import Village

        voter = db.query(ElectionVoter).filter(
            ElectionVoter.voter_code == voter_code,
            ElectionVoter.deleted_at.is_(None)
        ).first()

        if not voter:
            return {
                "valid": False,
                "reason": "invalid_code",
                "message": "This voting code is not valid. Check your SMS and try again.",
            }

        if voter.has_voted:
            return {
                "valid": False,
                "reason": "already_voted",
                "message": "This voting code has already been used to vote.",
            }

        election = db.query(Election).filter(
            Election.id == voter.election_id,
            Election.deleted_at.is_(None)
        ).first()

        if not election:
            return {
                "valid": False,
                "reason": "election_not_found",
                "message": "The election for this code no longer exists.",
            }

        if election.status != "active":
            return {
                "valid": False,
                "reason": "election_not_active",
                "message": f"This election is currently {election.status}. Voting is not open.",
            }

        nairobi = ZoneInfo("Africa/Nairobi")
        now = datetime.now(nairobi)
        if election.start_date and election.end_date:
            start = election.start_date.replace(tzinfo=nairobi)
            end = election.end_date.replace(tzinfo=nairobi)
            if now < start:
                return {
                    "valid": False,
                    "reason": "not_started",
                    "message": f"Voting opens on {start.strftime('%d %b, %I:%M %p')}.",
                }
            if now > end:
                return {
                    "valid": False,
                    "reason": "ended",
                    "message": "Voting for this election has closed.",
                }

        village = db.query(Village).filter(Village.id == election.village_id).first()

        return {
            "valid": True,
            "election": {
                "id": str(election.id),
                "title": election.title,
                "description": election.description,
                "status": election.status,
                "end_date": election.end_date.isoformat() if election.end_date else None,
                "organization_name": village.name if village else "MtaaLink",
            },
            "candidates": [
                {"id": c.get("id"), "name": c.get("name")}
                for c in (election.candidates or [])
            ],
            "voter_code": voter_code,
        }

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

        if not voters:
            return []

        # N+1 FIX: Pre-load all members in ONE query
        member_ids = list({v.member_id for v in voters if v.member_id})
        members_map = {
            m.id: m for m in db.query(Member).filter(Member.id.in_(member_ids)).all()
        } if member_ids else {}

        result = []
        for v in voters:
            member = members_map.get(v.member_id)
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

        # N+1 FIX: Load village name ONCE before the loop
        from app.models.village import Village
        village = db.query(Village).filter(Village.id == election.village_id).first()
        org_name = village.name if village else "MtaaLink"

        generated = []
        for member in new_members:
            voter_code = ElectionService.generate_voter_code(member.id)
            voter = ElectionVoter(
                election_id=election_id,
                member_id=member.id,
                voter_code=voter_code
            )
            db.add(voter)
            db.flush()

            sms_result = {"success": False, "error": "No phone number"}
            if member.phone:
                message = _build_voter_code_sms(election, org_name, voter_code)
                sms_result = SMSService.send_sms(
                    to_phone=member.phone,
                    message=message,
                    sms_type="transactional"
                )

            generated.append({
                "member_name": member.full_name,
                "member_phone": member.phone,
                "voter_code": voter_code,
                "sms_sent": sms_result.get("success", False),
                "sms_error": sms_result.get("error") if not sms_result.get("success") else None
            })

        db.commit()

        sent_count = sum(1 for g in generated if g["sms_sent"])

        return {
            "message": f"Generated {len(generated)} voter codes. SMS sent to {sent_count}.",
            "total": len(generated),
            "sms_sent": sent_count,
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

        if not member.phone:
            raise AppException(f"{member.full_name} has no phone number on file")

        from app.models.village import Village
        v = db.query(Village).filter(Village.id == election.village_id).first()
        org_name = v.name if v else "MtaaLink"
        message = _build_voter_code_sms(election, org_name, voter_code)
        sms_result = SMSService.send_sms(
            to_phone=member.phone,
            message=message,
            sms_type="transactional"
        )

        if not sms_result.get("success"):
            return {
                "success": False,
                "message": f"Failed to send SMS: {sms_result.get('error')}",
                "voter_code": voter_code,
                "member_name": member.full_name
            }

        return {
            "success": True,
            "message": f"Voter code sent to {member.full_name}",
            "voter_code": voter_code,
            "member_name": member.full_name,
            "member_phone": member.phone,
            "election_title": election.title,
            "message_id": sms_result.get("message_id")
        }
