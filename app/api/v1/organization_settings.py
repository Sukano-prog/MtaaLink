from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.member import Member
from app.models.village import Village

from fastapi import Request

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"], responses={404: {"description": "Not found"}})

@router.get("")
@router.get("/")
async def get_settings(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    village = db.query(Village).filter(Village.id == current_user.village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    default_settings = {
        "organization_name": "",
        "member_label": "Member",
        "custom_field_enabled": False,
        "custom_field_label": "",
        "custom_field_options": [],
        "age_enabled": False,
        "age_required": False,
        "group_label": "Group",
        "prefill_age_categories": True,
        "age_categories": [],
        "amount_format": "whole",
        "payment_autofill": True
    }
    
    settings = village.settings or {}
    for key in default_settings:
        if key not in settings:
            settings[key] = default_settings[key]
    
    return settings

@router.put("")
@router.put("/")
async def update_settings(
    settings: dict,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    village = db.query(Village).filter(Village.id == current_user.village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    village.settings = settings
    db.commit()
    
    return settings
