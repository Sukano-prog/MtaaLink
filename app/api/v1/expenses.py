from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.core.exceptions import AppException
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseCategoryCreate
from app.services.expense_service import ExpenseService
from app.models.member import Member

router = APIRouter(prefix="/api/v1/expenses", tags=["Expenses"])

# ===== CATEGORIES =====

@router.get("/categories")
async def get_categories(
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return ExpenseService.get_categories(db, current_user.village_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categories")
async def create_category(
    data: ExpenseCategoryCreate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ExpenseService.create_category(db, current_user.village_id, data.dict(), current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== EXPENSES =====

@router.get("/")
async def get_expenses(
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return ExpenseService.get_expenses(db, current_user.village_id, category, start_date, end_date, search)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_expense(
    data: ExpenseCreate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ExpenseService.create_expense(db, current_user.village_id, data.dict(), current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{expense_id}")
async def get_expense(
    expense_id: str,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return ExpenseService.get_expense(db, current_user.village_id, expense_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{expense_id}")
async def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ExpenseService.update_expense(db, current_user.village_id, expense_id, data.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ExpenseService.delete_expense(db, current_user.village_id, expense_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
