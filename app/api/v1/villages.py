"""
Management System - Organizations API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.village import Village
from app.core.security import get_current_user
from app.models.member import Member

router = APIRouter(prefix="/api/v1/organizations", tags=["Organizations"])

@router.get("/{org_id}")
async def get_organization(
    org_id: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user)
):
    """Get organization by ID"""
    org = db.query(Village).filter(Village.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    return {
        "id": org.id,
        "name": org.name,
        "admin_email": org.admin_email,
        "phone": org.admin_phone,
        "is_verified": org.is_verified
    }
