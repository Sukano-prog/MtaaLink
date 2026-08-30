from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    APP_URL: str = "http://localhost:3000"
    # App
    APP_NAME: str = "MtaaLink"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    BASE_URL: str = ""
    
    # Database
    DATABASE_URL: str = "sqlite:///./mtaalink.db"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Optional Services
    REDIS_URL: Optional[str] = None
    AT_USERNAME: Optional[str] = None
    AT_API_KEY: Optional[str] = None
    MPESA_CONSUMER_KEY: Optional[str] = None
    MPESA_CONSUMER_SECRET: Optional[str] = None
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
