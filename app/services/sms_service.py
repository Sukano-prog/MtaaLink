import os
import logging
import requests
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class SMSService:
    """Send SMS via Sozuri (primary) with Africa's Talking fallback."""

    SOZURI_BASE_URL = "https://sozuri.net/api/v1/messaging"
    SOZURI_PROJECT = "MtaaLink"

    AT_BASE_URL = "https://api.africastalking.com/version1/messaging"
    AT_SANDBOX_URL = "https://api.sandbox.africastalking.com/version1/messaging"

    # ---------- helpers ----------

    @staticmethod
    def _format_phone_sozuri(phone: str) -> str:
        """Sozuri expects +254XXXXXXXXX"""
        phone = phone.strip().replace(" ", "").replace("-", "")
        if phone.startswith("+"):
            return phone
        if phone.startswith("0"):
            return "+254" + phone[1:]
        if phone.startswith("254"):
            return "+" + phone
        return "+254" + phone

    @staticmethod
    def _format_phone_at(phone: str) -> str:
        """Africa's Talking expects 254XXXXXXXXX (no +)"""
        phone = phone.strip().replace(" ", "").replace("-", "")
        if phone.startswith("+"):
            return phone[1:]
        if phone.startswith("0"):
            return "254" + phone[1:]
        if phone.startswith("254"):
            return phone
        return "254" + phone

    # ---------- providers ----------

    @staticmethod
    def _send_via_sozuri(to_phone: str, message: str,
                         sender_id: Optional[str] = None,
                         sms_type: str = "transactional") -> Dict[str, Any]:
        api_key = os.getenv("SOZURI_API_KEY")
        if not api_key:
            return {"success": False, "error": "SOZURI_API_KEY not configured",
                    "provider": "sozuri"}

        payload = {
            "project": SMSService.SOZURI_PROJECT,
            "apiKey": api_key,
            "from": sender_id or os.getenv("SOZURI_SENDER_ID", "Sozuri"),
            "to": SMSService._format_phone_sozuri(to_phone),
            "message": message,
            "channel": "sms",
            "type": sms_type,
        }

        try:
            r = requests.post(
                SMSService.SOZURI_BASE_URL,
                json=payload,
                headers={"Content-Type": "application/json",
                         "Accept": "application/json"},
                timeout=15,
            )
            # 5xx means Sozuri infra problem -> caller falls back
            if r.status_code >= 500:
                return {"success": False,
                        "error": f"Sozuri {r.status_code}: {r.text[:120]}",
                        "provider": "sozuri",
                        "status_code": r.status_code}

            try:
                data = r.json()
            except Exception:
                data = {"raw": r.text}

            # Sozuri returns success inside recipients[0].status
            recipients = data.get("recipients") or []
            first = recipients[0] if recipients else {}
            ok = (
                r.status_code == 200
                and (
                    first.get("status") in ("sent", "success", "queued")
                    or data.get("success") is True
                    or data.get("status") in ("sent", "success", "queued")
                )
            )
            return {
                "success": ok,
                "provider": "sozuri",
                "status_code": r.status_code,
                "message_id": first.get("messageId") or data.get("message_id") or data.get("id"),
                "raw": data,
            }
        except (requests.Timeout, requests.ConnectionError) as e:
            return {"success": False, "error": f"Sozuri unreachable: {e}",
                    "provider": "sozuri"}
        except Exception as e:
            return {"success": False, "error": f"Sozuri error: {e}",
                    "provider": "sozuri"}

    @staticmethod
    def _send_via_africastalking(to_phone: str, message: str,
                                 sender_id: Optional[str] = None) -> Dict[str, Any]:
        api_key = os.getenv("AT_API_KEY")
        username = os.getenv("AT_USERNAME")
        if not api_key or not username:
            return {"success": False,
                    "error": "AT_API_KEY or AT_USERNAME not configured",
                    "provider": "africastalking"}

        base = (SMSService.AT_SANDBOX_URL if username == "sandbox"
                else SMSService.AT_BASE_URL)

        data = {
            "username": username,
            "to": SMSService._format_phone_at(to_phone),
            "message": message,
        }
        at_sender = sender_id or os.getenv("AT_SENDER_ID")
        if at_sender:
            data["from"] = at_sender

        try:
            r = requests.post(
                base,
                data=data,
                headers={"apiKey": api_key, "Accept": "application/json"},
                timeout=15,
            )

            try:
                body = r.json()
            except Exception:
                body = {"raw": r.text}

            recipients = (body.get("SMSMessageData", {})
                              .get("Recipients", []) or [])
            ok = (
                r.status_code == 200
                and len(recipients) > 0
                and recipients[0].get("status") in ("Success", "Sent")
            )
            return {
                "success": ok,
                "provider": "africastalking",
                "status_code": r.status_code,
                "message_id": recipients[0].get("messageId") if recipients else None,
                "raw": body,
                "error": None if ok else (body.get("SMSMessageData", {})
                                              .get("Message")
                                          or recipients[0].get("status")
                                          if recipients else r.text[:120]),
            }
        except (requests.Timeout, requests.ConnectionError) as e:
            return {"success": False, "error": f"AT unreachable: {e}",
                    "provider": "africastalking"}
        except Exception as e:
            return {"success": False, "error": f"AT error: {e}",
                    "provider": "africastalking"}

    # ---------- public API ----------

    @classmethod
    def send_sms(cls, to_phone: str, message: str,
                 sender_id: Optional[str] = None,
                 sms_type: str = "transactional") -> Dict[str, Any]:
        """Try Sozuri first, fall back to Africa's Talking on failure."""

        sozuri = cls._send_via_sozuri(to_phone, message, sender_id, sms_type)
        if sozuri.get("success"):
            logger.info("SMS sent via Sozuri to %s (id=%s)",
                        to_phone, sozuri.get("message_id"))
            return sozuri

        logger.warning("Sozuri failed for %s: %s — falling back to Africa's Talking",
                       to_phone, sozuri.get("error"))

        at = cls._send_via_africastalking(to_phone, message, sender_id)
        if at.get("success"):
            logger.info("SMS sent via Africa's Talking to %s (id=%s)",
                        to_phone, at.get("message_id"))
            return at

        logger.error("Both SMS providers failed for %s. Sozuri=%s | AT=%s",
                     to_phone, sozuri.get("error"), at.get("error"))
        return {
            "success": False,
            "error": f"Sozuri: {sozuri.get('error')} | AT: {at.get('error')}",
            "provider": "none",
            "attempts": {"sozuri": sozuri, "africastalking": at},
        }

    @classmethod
    def send_bulk_sms(cls, phone_numbers: List[str], message: str,
                      sender_id: Optional[str] = None,
                      sms_type: str = "transactional") -> Dict[str, Any]:
        results = []
        sent = 0
        for phone in phone_numbers:
            r = cls.send_sms(phone, message, sender_id, sms_type)
            results.append({"phone": phone, **r})
            if r.get("success"):
                sent += 1
        return {
            "success": sent > 0,
            "sent": sent,
            "total": len(phone_numbers),
            "results": results,
        }
