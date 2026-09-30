import os
import logging
import requests
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class SMSService:
    """Send SMS via Sozuri (Kenya)"""

    BASE_URL = "https://sozuri.net/api/v1/messaging"
    PROJECT = "MtaaLink"

    @classmethod
    def send_sms(
        cls,
        to_phone: str,
        message: str,
        sender_id: Optional[str] = None,
        sms_type: str = "transactional",
    ) -> Dict[str, Any]:
        api_key = os.environ.get("SOZURI_API_KEY")
        from_id = sender_id or os.environ.get("SOZURI_SENDER_ID", "Sozuri")

        if not api_key:
            logger.warning("Sozuri API key not configured")
            return {"success": False, "error": "SMS API key not configured"}

        try:
            phone = cls._format_phone(to_phone)

            payload = {
                "project": cls.PROJECT,
                "apiKey": api_key,
                "from": from_id,
                "to": phone,
                "message": message,
                "channel": "sms",
                "type": sms_type,
            }

            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
            }

            response = requests.post(
                cls.BASE_URL, json=payload, headers=headers, timeout=15
            )

            try:
                data = response.json()
            except ValueError:
                return {"success": False, "error": f"Invalid response: {response.text[:200]}"}

            # Sozuri success: recipients[0].status == "sent"
            recipients = data.get("recipients", [])
            if response.status_code == 200 and recipients and recipients[0].get("status") == "sent":
                message_id = recipients[0].get("messageId")
                logger.info(f"SMS sent to {phone} (ID: {message_id})")
                return {
                    "success": True,
                    "message_id": message_id,
                    "status": recipients[0].get("status"),
                    "bulk_id": recipients[0].get("bulkId"),
                }

            error = data.get("message") or data.get("error_code") or "Unknown error"
            logger.error(f"SMS failed to {phone}: {error}")
            return {"success": False, "error": error, "raw": data}

        except requests.exceptions.Timeout:
            logger.error(f"SMS timeout for {to_phone}")
            return {"success": False, "error": "SMS request timed out"}
        except requests.exceptions.RequestException as e:
            logger.error(f"SMS request error: {e}")
            return {"success": False, "error": str(e)}

    @classmethod
    def send_bulk_sms(
        cls,
        phone_numbers: List[str],
        message: str,
        sender_id: Optional[str] = None,
        sms_type: str = "transactional",
    ) -> Dict[str, Any]:
        results = {"sent": 0, "failed": 0, "details": []}
        for phone in phone_numbers:
            r = cls.send_sms(phone, message, sender_id, sms_type)
            if r.get("success"):
                results["sent"] += 1
            else:
                results["failed"] += 1
            results["details"].append({"phone": phone, "result": r})

        return {
            "success": results["failed"] == 0,
            "sent": results["sent"],
            "failed": results["failed"],
            "total": len(phone_numbers),
            "details": results["details"],
        }


    @staticmethod
    def get_village_name(db, village_id: str) -> str:
        """Get village name for SMS signing."""
        try:
            from app.models.village import Village
            village = db.query(Village).filter(Village.id == village_id).first()
            return village.name if village else ""
        except Exception as e:
            logger.error(f"get_village_name error: {e}")
            return ""

    @staticmethod
    def _format_phone(phone: str) -> str:
        """Normalize phone to +254XXXXXXXXX format"""
        phone = phone.strip().replace(" ", "").replace("-", "")
        if phone.startswith("+"):
            return phone
        if phone.startswith("0"):
            return "+254" + phone[1:]
        if phone.startswith("254"):
            return "+" + phone
        return "+254" + phone


def send_sms(to_phone: str, message: str, **kwargs) -> Dict[str, Any]:
    return SMSService.send_sms(to_phone, message, **kwargs)
