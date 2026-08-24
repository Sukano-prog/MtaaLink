"""
MtaaLink - WhatsApp Service
Handles sending messages via WhatsApp using Africa's Talking
"""

import africastalking
import logging
from typing import Dict, Optional, List

logger = logging.getLogger(__name__)

# Initialize Africa's Talking (same credentials)
username = "sandbox"
api_key = "atsk_eac6c58573f35cf048949b6132a5f76269da388414b6a0fe33f4bec6473649bbe0f84ebe"

africastalking.initialize(username, api_key)

class WhatsAppService:
    
    @staticmethod
    def send_message(phone_number: str, message: str) -> Dict:
        """Send a WhatsApp message"""
        try:
            # Format phone number
            if phone_number.startswith('0'):
                phone_number = '254' + phone_number[1:]
            elif not phone_number.startswith('254'):
                phone_number = '254' + phone_number
            
            # Get WhatsApp service
            whatsapp = africastalking.Whatsapp
            
            # Send via Africa's Talking WhatsApp API
            response = whatsapp.send(
                message=message,
                recipients=[phone_number]
            )
            logger.info(f"WhatsApp message sent to {phone_number}")
            return {"success": True, "response": response}
        except Exception as e:
            logger.error(f"Failed to send WhatsApp: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def send_announcement(phone_number: str, title: str, message: str) -> Dict:
        """Send an announcement via WhatsApp"""
        formatted_message = f"*{title}*\n\n{message}\n\n_MtaaLink - Village Management_"
        return WhatsAppService.send_message(phone_number, formatted_message)
    
    @staticmethod
    def send_voter_code(phone_number: str, voter_code: str, election_title: str, candidates: list) -> Dict:
        """Send voter code via WhatsApp with rich formatting"""
        candidate_list = "\n".join([f" {i+1}. {c['name']}" for i, c in enumerate(candidates[:5])])
        if len(candidates) > 5:
            candidate_list += f"\n... and {len(candidates)-5} more"
        
        message = f"""*{election_title}*

*Candidates:*
{candidate_list}

*Your voter code:* `{voter_code}`

*To vote:* `VOTE {voter_code} [NUMBER]`
*To check results:* `RESULTS {voter_code}`

_One-time use only. Do not share._"""
        
        return WhatsAppService.send_message(phone_number, message)
    
    @staticmethod
    def send_vote_confirmation(phone_number: str, candidate_name: str, election_title: str) -> Dict:
        """Send vote confirmation via WhatsApp"""
        message = f"""*Vote Confirmed!*

You voted for: *{candidate_name}*
Election: *{election_title}*

Thank you for participating in MtaaLink!"""
        
        return WhatsAppService.send_message(phone_number, message)
    
    @staticmethod
    def send_results(phone_number: str, results: Dict) -> Dict:
        """Send election results via WhatsApp"""
        results_lines = []
        for r in results.get('results', []):
            results_lines.append(f" {r['candidate_name']}: {r['votes']} votes ({r['percentage']}%)")
        
        message = f"""*Election Results*

*{results.get('election_title', 'Election')}*
Total votes: {results.get('total_votes', 0)}
Turnout: {results.get('turnout', 0)}%

{chr(10).join(results_lines)}

_MtaaLink - Village Management_"""
        
        return WhatsAppService.send_message(phone_number, message)
