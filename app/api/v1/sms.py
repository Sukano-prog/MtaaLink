"""
MtaaLink - SMS Webhook
Handles incoming SMS from Africa's Talking
"""

from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.election import Election, ElectionVoter, ElectionVote
from app.services.sms_service import SMSService
import logging
from datetime import datetime
import hashlib
import uuid

router = APIRouter(prefix="/api/v1/sms", tags=["SMS"])
logger = logging.getLogger(__name__)

@router.post("/incoming")
async def handle_incoming_sms(request: Request):
    """Handle incoming SMS from Africa's Talking"""
    try:
        data = await request.form()
        
        phone_number = data.get('from', '')
        message = data.get('text', '')
        
        logger.info(f"Incoming SMS from {phone_number}: {message}")
        
        # Parse vote message
        vote_data = SMSService.parse_vote_message(message)
        if vote_data:
            return await process_vote(phone_number, vote_data)
        
        # Parse results message
        voter_code = SMSService.parse_results_message(message)
        if voter_code:
            return await process_results(phone_number, voter_code)
        
        # Unknown message
        return {"status": "unknown", "message": "Send: VOTE [CODE] [NUMBER] or RESULTS [CODE]"}
    
    except Exception as e:
        logger.error(f"SMS webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

async def process_vote(phone_number: str, vote_data: dict):
    """Process an SMS vote"""
    try:
        db = next(get_db())
        
        # Find the voter by code
        voter = db.query(ElectionVoter).filter(
            ElectionVoter.voter_code == vote_data['voter_code'],
            ElectionVoter.has_voted == False
        ).first()
        
        if not voter:
            SMSService.send_sms(phone_number, "Invalid or already used voter code.")
            return {"status": "error", "message": "Invalid code"}
        
        # Get election
        election = db.query(Election).filter(Election.id == voter.election_id).first()
        if not election or election.status != 'active':
            SMSService.send_sms(phone_number, "Election is not active.")
            return {"status": "error", "message": "Election not active"}
        
        # Get candidates from JSON
        candidates = election.candidates or []
        candidate_number = vote_data['candidate_number'] - 1
        
        if candidate_number < 0 or candidate_number >= len(candidates):
            SMSService.send_sms(phone_number, f"Invalid candidate number. Choose 1-{len(candidates)}.")
            return {"status": "error", "message": "Invalid candidate"}
        
        candidate = candidates[candidate_number]
        candidate_id = candidate.get('id', '')
        candidate_name = candidate.get('name', '')
        
        # Check if vote already exists for this voter code
        existing_vote = db.query(ElectionVote).filter(
            ElectionVote.election_id == election.id,
            ElectionVote.voter_code == vote_data['voter_code']
        ).first()
        
        if existing_vote:
            SMSService.send_sms(phone_number, "You have already voted in this election.")
            return {"status": "error", "message": "Already voted"}
        
        # Create vote record
        vote_hash = hashlib.sha256(
            f"{election.id}{voter.voter_code}{candidate_id}{datetime.now()}".encode()
        ).hexdigest()
        
        vote = ElectionVote(
            id=str(uuid.uuid4()),
            election_id=election.id,
            voter_code=voter.voter_code,
            candidate_id=candidate_id,
            candidate_name=candidate_name,
            vote_hash=vote_hash
        )
        db.add(vote)
        
        # Mark voter as voted
        voter.has_voted = True
        voter.voted_at = datetime.now()
        
        db.commit()
        
        # Send confirmation
        SMSService.send_vote_confirmation(db, phone_number, candidate_name, election.title, election.village_id)
        
        return {"status": "success", "message": "Vote recorded"}
    
    except Exception as e:
        logger.error(f"Process vote error: {str(e)}")
        db.rollback()
        return {"status": "error", "message": str(e)}

async def process_results(phone_number: str, voter_code: str):
    """Process an SMS results request"""
    try:
        db = next(get_db())
        
        # Find the voter
        voter = db.query(ElectionVoter).filter(
            ElectionVoter.voter_code == voter_code
        ).first()
        
        if not voter:
            SMSService.send_sms(phone_number, "Invalid voter code.")
            return {"status": "error", "message": "Invalid code"}
        
        # Get election
        election = db.query(Election).filter(Election.id == voter.election_id).first()
        if not election:
            SMSService.send_sms(phone_number, "Election not found.")
            return {"status": "error", "message": "Election not found"}
        
        # Get results from votes
        votes = db.query(ElectionVote).filter(
            ElectionVote.election_id == election.id
        ).all()
        
        # Count votes per candidate
        candidates = election.candidates or []
        results = []
        total_votes = len(votes)
        
        # Count votes for each candidate
        vote_counts = {}
        for vote in votes:
            vote_counts[vote.candidate_name] = vote_counts.get(vote.candidate_name, 0) + 1
        
        # Build results
        for candidate in candidates:
            name = candidate.get('name', '')
            votes_count = vote_counts.get(name, 0)
            percentage = round((votes_count / total_votes * 100), 1) if total_votes > 0 else 0
            results.append({
                'candidate_name': name,
                'votes': votes_count,
                'percentage': percentage
            })
        
        # Sort by votes descending
        results.sort(key=lambda x: x['votes'], reverse=True)
        
        # Get total voters
        total_voters = db.query(ElectionVoter).filter(
            ElectionVoter.election_id == election.id
        ).count()
        
        turnout = round((total_votes / total_voters * 100), 1) if total_voters > 0 else 0
        
        results_data = {
            'election_title': election.title,
            'total_votes': total_votes,
            'total_voters': total_voters,
            'turnout': turnout,
            'results': results,
            'status': election.status
        }
        
        # Send results via SMS
        SMSService.send_results(db, phone_number, results_data, election.village_id)
        
        return {"status": "success", "message": "Results sent"}
    
    except Exception as e:
        logger.error(f"Process results error: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.post("/test")
async def test_sms(request: Request):
    """Test endpoint for sending SMS"""
    try:
        data = await request.json()
        phone = data.get('phone', '')
        message = data.get('message', 'Test message from MtaaLink')
        
        # Format phone number
        if phone.startswith('0'):
            phone = '254' + phone[1:]
        elif not phone.startswith('254'):
            phone = '254' + phone
        
        result = SMSService.send_sms(phone, message)
        return {"status": "success", "result": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}
