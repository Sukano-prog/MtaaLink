import os
import logging
from dotenv import load_dotenv
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

load_dotenv()

logger = logging.getLogger(__name__)

def send_verification_email(to_email: str, verification_link: str) -> bool:
    """Send verification email using SendGrid"""
    api_key = os.environ.get('SENDGRID_API_KEY')
    from_email = os.environ.get('SENDGRID_FROM_EMAIL')
    
    if not api_key or not from_email:
        logger.warning("SendGrid not configured")
        return False
    
    try:
        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject="Verify your email for MtaaLink",
            html_content=f'''
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; background: #f5f7fa; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    .header {{ text-align: center; margin-bottom: 30px; }}
                    .header h1 {{ color: #1a73e8; font-size: 24px; margin: 0; }}
                    .btn {{ display: inline-block; background: #1a73e8; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }}
                    .link-box {{ background: #f5f7fa; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 13px; }}
                    .footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>MtaaLink</h1>
                        <p>Verify your email address</p>
                    </div>
                    <div style="padding: 20px 0;">
                        <p>Hello,</p>
                        <p>Thank you for registering on MtaaLink.</p>
                        <p>Please click the button below to verify your email address:</p>
                        <div style="text-align: center;">
                            <a href="{verification_link}" class="btn">Verify Email</a>
                        </div>
                        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                        <p class="link-box">{verification_link}</p>
                        <p style="color: #999; font-size: 13px;">This link will expire in 24 hours.</p>
                        <p style="margin-top: 20px; color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>MtaaLink</p>
                    </div>
                </div>
            </body>
            </html>
            '''
        )
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        
        if response.status_code == 202:
            logger.info(f"Verification email sent to {to_email}")
            return True
        else:
            logger.error(f"SendGrid error: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Email error: {e}")
        return False
