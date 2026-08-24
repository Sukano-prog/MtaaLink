from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.core.exceptions import AppException
from app.models.member import Member
from app.models.election import Election, ElectionVoter, ElectionVote
from app.schemas.election import ElectionCreate, ElectionUpdate
from app.services.election_service import ElectionService

router = APIRouter(prefix="/api/v1/elections", tags=["Elections"])

# ===== ADMIN ENDPOINTS =====

@router.get("/")
async def get_elections(
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return ElectionService.get_elections(db, current_user.village_id, status, search)
    except AppException as e:
        raise e

@router.get("/{election_id}")
async def get_election(
    election_id: str,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return ElectionService.get_election(db, current_user.village_id, election_id)
    except AppException as e:
        raise e

@router.post("/")
async def create_election(
    data: ElectionCreate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ElectionService.create_election(db, current_user.village_id, data.dict(), current_user.id)
    except AppException as e:
        raise e

@router.post("/{election_id}/start")
async def start_election(
    election_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ElectionService.start_election(db, current_user.village_id, election_id)
    except AppException as e:
        raise e

@router.post("/{election_id}/close")
async def close_election(
    election_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ElectionService.close_election(db, current_user.village_id, election_id)
    except AppException as e:
        raise e

@router.get("/{election_id}/results")
async def get_results(
    election_id: str,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return ElectionService.get_results(db, election_id)
    except AppException as e:
        raise e

@router.get("/{election_id}/voters")
@router.get("/{election_id}/voters/")
async def get_voter_codes_endpoint(
    election_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all voter codes for an election (admin only)"""
    try:
        return ElectionService.get_voter_codes(db, election_id)
    except AppException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{election_id}/generate-codes")
@router.post("/{election_id}/generate-codes/")
async def generate_voter_codes_endpoint(
    election_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Generate voter codes for members without codes"""
    try:
        return ElectionService.generate_voter_codes(db, election_id)
    except AppException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/resend-code")
@router.post("/resend-code/")
async def resend_voter_code(
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Resend a voter code"""
    try:
        return ElectionService.resend_voter_code(db, data.get('voter_code'))
    except AppException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{election_id}/verify/{voter_code}")
@router.get("/{election_id}/verify/{voter_code}/")
async def verify_voter_code(
    election_id: str,
    voter_code: str,
    db: Session = Depends(get_db)
):
    """Public endpoint to verify a voter code"""
    try:
        voter = db.query(ElectionVoter).filter(
            ElectionVoter.election_id == election_id,
            ElectionVoter.voter_code == voter_code,
            ElectionVoter.deleted_at.is_(None)
        ).first()
        
        if not voter:
            return {"valid": False, "message": "Invalid voter code"}
        
        if voter.has_voted:
            return {"valid": False, "message": "This voter code has already been used"}
        
        return {"valid": True, "message": "Valid voter code"}
    except Exception as e:
        return {"valid": False, "message": str(e)}

# ===== PUBLIC VOTING ENDPOINT =====

@router.post("/vote")
@router.post("/vote/")
async def cast_vote(
    data: dict,
    db: Session = Depends(get_db)
):
    """Public endpoint - no authentication required, only voter code"""
    try:
        voter_code = data.get('voter_code')
        candidate_id = data.get('candidate_id')
        
        if not voter_code or not candidate_id:
            raise HTTPException(status_code=400, detail="voter_code and candidate_id required")
        
        return ElectionService.cast_vote(db, voter_code, candidate_id)
    except AppException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{election_id}")
async def update_election(
    election_id: str,
    data: ElectionUpdate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ElectionService.update_election(db, current_user.village_id, election_id, data.dict())
    except AppException as e:
        raise e

@router.get("/{election_id}/results")
@router.get("/{election_id}/results/")
async def get_results(
    election_id: str,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return ElectionService.get_results(db, election_id)
    except AppException as e:
        raise HTTPException(status_code=400, detail=str(e))
