from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import bcrypt
import uuid
from datetime import datetime
from app.core.database import get_db
from app.models.village import Village
from app.models.member import Member
from app.core.security import hash_password

router = APIRouter(prefix="/api/v1/setup", tags=["Setup"])

@router.get("/")
async def create_admin(db: Session = Depends(get_db)):
    """Create default admin if it doesn't exist"""
    
    # Check if admin exists
    admin = db.query(Member).filter(Member.email == "admin@mtaalink.com").first()
    if admin:
        return {"message": "Admin already exists", "email": "admin@mtaalink.com"}
    
    # Check if village exists
    village = db.query(Village).first()
    if not village:
        village_id = str(uuid.uuid4())
        village = Village(
            id=village_id,
            name="Nairobi Village",
            admin_email="admin@mtaalink.com",
            admin_phone="0712345678",
            is_verified=True,
            created_at=datetime.utcnow()
        )
        db.add(village)
        db.flush()
    else:
        village_id = village.id
    
    # Create admin
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
        "message": "Admin created successfully",
        "email": "admin@mtaalink.com",
        "password": "Admin@2024",
        "village_name": village.name
    }


@router.get("/reset")
async def reset_password(db: Session = Depends(get_db)):
    """Reset admin password"""
    admin = db.query(Member).filter(Member.email == "admin@mtaalink.com").first()
    if not admin:
        return {"message": "Admin not found"}
    
    import bcrypt
    password_hash = bcrypt.hashpw("Admin@2024".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    admin.password_hash = password_hash
    db.commit()
    
    return {
        "message": "Password reset successfully",
        "email": "admin@mtaalink.com",
        "password": "Admin@2024"
    }


@router.get("/reset")
async def reset_password(db: Session = Depends(get_db)):
    """Reset admin password using correct hash"""
    from app.core.security import hash_password
    admin = db.query(Member).filter(Member.email == "admin@mtaalink.com").first()
    if not admin:
        return {"message": "Admin not found"}
    
    admin.password_hash = hash_password("Admin@2024")
    db.commit()
    
    return {
        "message": "Password reset successfully",
        "email": "admin@mtaalink.com",
        "password": "Admin@2024"
    }
