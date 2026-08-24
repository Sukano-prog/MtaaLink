from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.member import Member

# Database dependency
def db_dependency() -> Session:
    return Depends(get_db)

# Auth dependencies
def current_user_dependency() -> Member:
    return Depends(get_current_user)

def admin_user_dependency() -> Member:
    return Depends(get_current_admin)
