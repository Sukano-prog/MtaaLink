from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import bcrypt
import uuid
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.village import Village
from app.models.member import Member

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

@router.post("/setup")
async def setup_admin(db: Session = Depends(get_db)):
    """Create default admin and village if they don't exist"""
    
    # Check if any village exists
    village = db.query(Village).first()
    
    if not village:
        # Create a default village
        village_id = str(uuid.uuid4())
        village = Village(
            id=village_id,
            name="Nairobi Village",
            admin_email="admin@mtaalink.com",
            admin_phone="0712345678",
            is_verified=True,
            trial_ends=datetime.utcnow() + timedelta(days=365),
            created_at=datetime.utcnow()
        )
        db.add(village)
        db.flush()
        
        # Check if admin member exists
        admin = db.query(Member).filter(
            Member.village_id == village_id,
            Member.email == "admin@mtaalink.com"
        ).first()
        
        if not admin:
            # Create admin member
            password_hash = bcrypt.hashpw("Admin@2024".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            admin = Member(
                id=str(uuid.uuid4()),
                village_id=village_id,
                first_name="Admin",
                last_name="User",
                email="admin@mtaalink.com",
                phone="0712345678",
                password_hash=password_hash,
                role="admin",
                is_active=True,
                member_number="ADMIN-001",
                created_at=datetime.utcnow()
            )
            db.add(admin)
            db.commit()
            
            return {
                "message": "Admin and village created successfully",
                "email": "admin@mtaalink.com",
                "password": "Admin@2024",
                "village_name": village.name
            }
    
    return {"message": "Admin already exists", "email": "admin@mtaalink.com"}
