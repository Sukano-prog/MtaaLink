import os
from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Settings(BaseSettings):
    APP_URL: str = "http://localhost:3000"
    # App
    APP_NAME: str = "MtaaLink"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    APP_URL: str = "http://localhost:3000"  # Added this
    
    # Database
    DATABASE_URL: str = "sqlite:///./mtaalink.db"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    
    # SMS (Africa's Talking)
    SMS_USERNAME: str = "sandbox"
    SMS_API_KEY: str = ""
    SMS_SENDER_ID: str = "MtaaLink"
    
    # Email (SendGrid)
    SENDGRID_API_KEY: str = os.environ.get("SENDGRID_API_KEY", "")
    SENDGRID_FROM_EMAIL: str = os.environ.get("SENDGRID_FROM_EMAIL", "noreply@mtaalink.com")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
