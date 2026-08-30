"""
MtaaLink - Accounts API (System-wide)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.village import Village
from app.models.member import Member

router = APIRouter(prefix="/api/v1/accounts", tags=["Accounts"])

@router.get("/")
async def get_all_accounts(
    db: Session = Depends(get_db)
):
    """Get all registered accounts (public endpoint)"""
    villages = db.query(Village).filter(
        Village.deleted_at.is_(None)
    ).all()
    
    result = []
    for v in villages:
        member_count = db.query(Member).filter(
            Member.village_id == v.id,
            Member.deleted_at.is_(None)
        ).count()
        
        result.append({
            "id": v.id,
            "name": v.name,
            "admin_email": v.admin_email,
            "admin_phone": v.admin_phone,
            "is_verified": v.is_verified,
            "member_count": member_count,
            "created_at": v.created_at.isoformat() if v.created_at else None
        })
    
    return {"accounts": result}
