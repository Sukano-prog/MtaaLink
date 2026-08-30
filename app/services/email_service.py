"""
MtaaLink - Email Service (SendGrid)
"""
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Send emails using SendGrid"""
    
    @staticmethod
    def send_verification_email(to_email: str, verification_link: str, organization_name: str):
        """Send verification email to new user"""
        try:
            api_key = os.environ.get('SENDGRID_API_KEY')
            from_email = os.environ.get('SENDGRID_FROM_EMAIL', 'noreply@mtaalink.com')
            
            if not api_key:
                logger.warning("SendGrid API key not configured. Email not sent.")
                return {"success": False, "error": "SendGrid API key not configured"}
            
            subject = f"Verify your email for {organization_name}"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; background: #f5f7fa; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    .header {{ text-align: center; margin-bottom: 30px; }}
                    .header h1 {{ color: #1a73e8; font-size: 24px; margin: 0; }}
                    .header p {{ color: #666; font-size: 16px; margin-top: 5px; }}
                    .content {{ color: #333; line-height: 1.6; }}
                    .btn {{ display: inline-block; background: #1a73e8; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }}
                    .btn:hover {{ background: #1557b0; }}
                    .footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }}
                    .expiry {{ color: #999; font-size: 13px; }}
                    .link-box {{ background: #f5f7fa; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 13px; color: #1a73e8; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>MtaaLink</h1>
                        <p>Verify your email address</p>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>Thank you for registering <strong>{organization_name}</strong> on MtaaLink.</p>
                        <p>Please click the button below to verify your email address:</p>
                        <div style="text-align: center;">
                            <a href="{verification_link}" class="btn">Verify Email</a>
                        </div>
                        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                        <p class="link-box">{verification_link}</p>
                        <p class="expiry">This link will expire in 7 days.</p>
                        <p style="margin-top: 20px; color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>MtaaLink - Community Management System</p>
                        <p>Built for Kenya</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Plain text version without any emojis
            text_content = f"""
MtaaLink - Verify your email for {organization_name}

Hello,

Thank you for registering {organization_name} on MtaaLink.

Please verify your email address by visiting this link:
{verification_link}

This link will expire in 7 days.

If you didn't request this, please ignore this email.

Best regards,
The MtaaLink Team

---
MtaaLink - Community Management System
Built for Kenya
"""
            
            message = Mail(
                from_email=from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            # Add plain text version
            message.add_content(Content("text/plain", text_content))
            
            sg = SendGridAPIClient(api_key)
            response = sg.send(message)
            
            if response.status_code == 202:
                logger.info(f"Verification email sent to {to_email}")
                return {"success": True, "message": "Verification email sent"}
            else:
                logger.error(f"SendGrid error: {response.status_code} - {response.body}")
                return {"success": False, "error": f"SendGrid error: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Email sending failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def send_password_reset_email(to_email: str, reset_link: str, organization_name: str = "MtaaLink"):
        """Send password reset email"""
        try:
            api_key = os.environ.get('SENDGRID_API_KEY')
            from_email = os.environ.get('SENDGRID_FROM_EMAIL', 'noreply@mtaalink.com')
            
            if not api_key:
                logger.warning("SendGrid API key not configured. Email not sent.")
                return {"success": False, "error": "SendGrid API key not configured"}
            
            subject = f"Password Reset for {organization_name}"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; background: #f5f7fa; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    .header {{ text-align: center; margin-bottom: 30px; }}
                    .header h1 {{ color: #1a73e8; font-size: 24px; margin: 0; }}
                    .header p {{ color: #666; font-size: 16px; margin-top: 5px; }}
                    .content {{ color: #333; line-height: 1.6; }}
                    .btn {{ display: inline-block; background: #1a73e8; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }}
                    .btn:hover {{ background: #1557b0; }}
                    .footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }}
                    .expiry {{ color: #999; font-size: 13px; }}
                    .link-box {{ background: #f5f7fa; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 13px; color: #1a73e8; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>MtaaLink</h1>
                        <p>Password Reset</p>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>We received a request to reset your password for <strong>{organization_name}</strong>.</p>
                        <p>Click the button below to reset your password:</p>
                        <div style="text-align: center;">
                            <a href="{reset_link}" class="btn">Reset Password</a>
                        </div>
                        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                        <p class="link-box">{reset_link}</p>
                        <p class="expiry">This link will expire in 1 hour.</p>
                        <p style="margin-top: 20px; color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>MtaaLink - Community Management System</p>
                        <p>Built for Kenya</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
MtaaLink - Password Reset for {organization_name}

Hello,

We received a request to reset your password for {organization_name}.

Reset your password by visiting this link:
{reset_link}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
The MtaaLink Team

---
MtaaLink - Community Management System
Built for Kenya
"""
            
            message = Mail(
                from_email=from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            message.add_content(Content("text/plain", text_content))
            
            sg = SendGridAPIClient(api_key)
            response = sg.send(message)
            
            if response.status_code == 202:
                logger.info(f"Password reset email sent to {to_email}")
                return {"success": True, "message": "Password reset email sent"}
            else:
                logger.error(f"SendGrid error: {response.status_code}")
                return {"success": False, "error": f"SendGrid error: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Email sending failed: {str(e)}")
            return {"success": False, "error": str(e)}
