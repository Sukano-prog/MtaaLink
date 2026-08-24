"""
MtaaLink - SMS Service
Handles sending and receiving SMS via Africa's Talking
"""

import africastalking
import logging
import re
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Initialize Africa's Talking
username = "sandbox"
api_key = "atsk_eac6c58573f35cf048949b6132a5f76269da388414b6a0fe33f4bec6473649bbe0f84ebe"

africastalking.initialize(username, api_key)
sms = africastalking.SMS

class SMSService:
    
    @staticmethod
    def get_village_name(db, village_id: str) -> str:
        """Get village name from database"""
        try:
            from app.models.village import Village
            village = db.query(Village).filter(Village.id == village_id).first()
            return village.name if village else "MtaaLink"
        except:
            return "MtaaLink"
    
    @staticmethod
    def send_sms(phone_number: str, message: str, village_name: str = "MtaaLink") -> Dict:
        """Send an SMS message"""
        try:
            # Format phone number
            if phone_number.startswith('0'):
                phone_number = '254' + phone_number[1:]
            elif not phone_number.startswith('254'):
                phone_number = '254' + phone_number
            
            # Use village name as sender ID (max 11 characters)
            sender_id = village_name[:11] if village_name else "MtaaLink"
            
            response = sms.send(message, [phone_number], sender_id=sender_id)
            logger.info(f"SMS sent to {phone_number} from {sender_id}")
            return {"success": True, "response": response}
        except Exception as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def send_voter_code(db, phone_number: str, voter_code: str, election_title: str, candidates: list, village_id: str) -> Dict:
        """Send voter code and candidate list to voter"""
        village_name = SMSService.get_village_name(db, village_id)
        
        candidate_list = "\n".join([f"{i+1}. {c['name']}" for i, c in enumerate(candidates[:5])])
        if len(candidates) > 5:
            candidate_list += f"\n... and {len(candidates)-5} more"
        
        message = f"""{village_name}: {election_title}

Candidates:
{candidate_list}

Your voter code: {voter_code}

To vote: VOTE {voter_code} [NUMBER]
To check results: RESULTS {voter_code}

One-time use only. Do not share."""
        
        return SMSService.send_sms(phone_number, message, village_name)
    
    @staticmethod
    def send_vote_confirmation(db, phone_number: str, candidate_name: str, election_title: str, village_id: str) -> Dict:
        """Send vote confirmation"""
        village_name = SMSService.get_village_name(db, village_id)
        
        message = f"""{village_name}: Vote confirmed!

You voted for: {candidate_name}
Election: {election_title}

Thank you for participating!"""
        
        return SMSService.send_sms(phone_number, message, village_name)
    
    @staticmethod
    def send_results(db, phone_number: str, results: Dict, village_id: str) -> Dict:
        """Send election results"""
        village_name = SMSService.get_village_name(db, village_id)
        
        results_lines = []
        for r in results.get('results', []):
            results_lines.append(f"{r['candidate_name']}: {r['votes']} votes ({r['percentage']}%)")
        
        message = f"""{village_name} Election Results

{results.get('election_title', 'Election')}
Total votes: {results.get('total_votes', 0)}
Turnout: {results.get('turnout', 0)}%

{chr(10).join(results_lines)}"""
        
        return SMSService.send_sms(phone_number, message, village_name)
    
    @staticmethod
    def parse_vote_message(message: str) -> Optional[Dict]:
        """Parse incoming SMS vote message"""
        pattern = r'^VOTE\s+([A-Z0-9-]+)\s+(\d+)$'
        match = re.search(pattern, message.strip().upper())
        if not match:
            return None
        
        return {
            'voter_code': match.group(1),
            'candidate_number': int(match.group(2))
        }
    
    @staticmethod
    def parse_results_message(message: str) -> Optional[str]:
        """Parse incoming SMS results request"""
        pattern = r'^RESULTS\s+([A-Z0-9-]+)$'
        match = re.search(pattern, message.strip().upper())
        if not match:
            return None
        
        return match.group(1)
