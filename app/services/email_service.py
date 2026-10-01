import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SMTP_SERVER = "smtp-relay.brevo.com"
SMTP_PORT = 587
SMTP_LOGIN = os.environ.get("BREVO_SMTP_LOGIN")
SMTP_KEY = os.environ.get("BREVO_SMTP_KEY")
FROM_EMAIL = os.environ.get("BREVO_FROM_EMAIL", "simplystoresapp@gmail.com")


def _send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email via Brevo SMTP"""
    if not SMTP_LOGIN or not SMTP_KEY:
        logger.warning("Brevo SMTP not configured")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_LOGIN, SMTP_KEY)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())

        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Email error: {e}")
        return False


def send_verification_email(to_email: str, verification_link: str) -> bool:
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
            <h1 style="color: #1a73e8;">MtaaLink</h1>
            <p>Thank you for registering. Please verify your email address:</p>
            <p style="text-align: center;">
                <a href="{verification_link}"
                   style="display:inline-block;background:#1a73e8;color:white;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:600;">
                   Verify Email
                </a>
            </p>
            <p style="color:#666;font-size:13px;">Or copy this link: {verification_link}</p>
            <p style="color:#999;font-size:12px;">This link expires in 24 hours.</p>
        </div>
    </body>
    </html>
    """
    return _send_email(to_email, "Verify your email for MtaaLink", html)


def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
            <h1 style="color: #1a73e8;">MtaaLink</h1>
            <p>We received a request to reset your password.</p>
            <p style="text-align: center;">
                <a href="{reset_link}"
                   style="display:inline-block;background:#1a73e8;color:white;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:600;">
                   Reset Password
                </a>
            </p>
            <p style="color:#666;font-size:13px;">Or copy this link: {reset_link}</p>
            <p style="color:#999;font-size:12px;">This link expires in 1 hour.</p>
        </div>
    </body>
    </html>
    """
    return _send_email(to_email, "Reset your password for MtaaLink", html)


def send_invite_email(
    to_email: str,
    set_password_link: str,
    first_name: str,
    village_name: str,
    invited_by: str = "an admin",
) -> bool:
    """Send an invite email to a newly created member."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
            <h1 style="color: #1a73e8;">MtaaLink</h1>
            <p>Hi {first_name},</p>
            <p><strong>{invited_by}</strong> has invited you to join
               <strong>{village_name}</strong> on MtaaLink &mdash; a platform
               for managing meetings, contributions, and elections.</p>
            <p>Click the button below to set your password and activate your account:</p>
            <p style="text-align: center;">
                <a href="{set_password_link}"
                   style="display:inline-block;background:#1a73e8;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;">
                   Set My Password
                </a>
            </p>
            <p style="color:#666;font-size:13px;">Or copy this link into your browser:<br>
                <span style="word-break:break-all;">{set_password_link}</span>
            </p>
            <p style="color:#999;font-size:12px;">This invitation expires in 7 days.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
            <p style="color:#999;font-size:11px;">MtaaLink &middot; Village Management Platform</p>
        </div>
    </body>
    </html>
    """
    return _send_email(
        to_email,
        f"You're invited to {village_name} on MtaaLink",
        html,
    )
