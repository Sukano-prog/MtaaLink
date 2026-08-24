from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import date, datetime
from decimal import Decimal
from app.core.exceptions import NotFoundException
from app.models.expense import Expense
from app.models.project import Project
from app.models.expense import ExpenseCategory
from app.models.member import Member

class ExpenseService:
    
    @staticmethod
    def get_expenses(db: Session, village_id: str, category: Optional[str] = None,
                     start_date: Optional[str] = None, end_date: Optional[str] = None, search: Optional[str] = None) -> List[Dict]:
        query = db.query(Expense).filter(
            Expense.village_id == village_id,
            Expense.deleted_at.is_(None)
        )
        
        if category:
            query = query.filter(Expense.category == category)
        if search:
            query = query.filter(Expense.description.ilike(f'%{search}%'))
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        
        expenses = query.order_by(Expense.expense_date.desc()).all()
        
        result = []
        for e in expenses:
            recorder = db.query(Member).filter(Member.id == e.recorded_by).first()
            approver = db.query(Member).filter(Member.id == e.approved_by).first()
            
            result.append({
                "id": str(e.id),
                "description": e.description,
                "amount": float(e.amount),
                "category": e.category,
                "expense_date": e.expense_date.isoformat(),
                "payment_method": e.payment_method,
                "receipt_number": e.receipt_number,
                "notes": e.notes,
                "recorded_by_name": recorder.full_name if recorder else "Unknown",
                "approved_by_name": approver.full_name if approver else None,
                "created_at": e.created_at.isoformat()
            })
        
        return result
    
    @staticmethod
    def get_expense(db: Session, village_id: str, expense_id: str) -> Dict:
        expense = db.query(Expense).filter(
            Expense.id == expense_id,
            Expense.village_id == village_id,
            Expense.deleted_at.is_(None)
        ).first()
        
        if not expense:
            raise NotFoundException("Expense")
        
        recorder = db.query(Member).filter(Member.id == expense.recorded_by).first()
        approver = db.query(Member).filter(Member.id == expense.approved_by).first()
        
        return {
            "id": str(expense.id),
            "description": expense.description,
            "amount": float(expense.amount),
            "category": expense.category,
            "expense_date": expense.expense_date.isoformat(),
            "payment_method": expense.payment_method,
            "receipt_number": expense.receipt_number,
            "notes": expense.notes,
            "recorded_by_name": recorder.full_name if recorder else "Unknown",
            "approved_by_name": approver.full_name if approver else None,
            "project_id": str(expense.project_id) if expense.project_id else None,
            "event_id": str(expense.event_id) if expense.event_id else None,
            "meeting_id": str(expense.meeting_id) if expense.meeting_id else None,
            "created_at": expense.created_at.isoformat()
        }
    
    @staticmethod
    def create_expense(db: Session, village_id: str, data: dict, current_user_id: str) -> Dict:
        # Check if category exists, if not create it
        category = db.query(ExpenseCategory).filter(
            ExpenseCategory.village_id == village_id,
            ExpenseCategory.name == data['category'],
            ExpenseCategory.deleted_at.is_(None)
        ).first()
        
        if not category:
            # Create the category
            import uuid
            category = ExpenseCategory(
                id=str(uuid.uuid4()),
                village_id=village_id,
                name=data['category'],
                created_by=current_user_id,
                is_active=True
            )
            db.add(category)
            db.flush()
        
        expense = Expense(
            village_id=village_id,
            description=data['description'],
            amount=data['amount'],
            category=data['category'],
            expense_date=data['expense_date'],
            payment_method=data.get('payment_method'),
            receipt_number=data.get('receipt_number'),
            notes=data.get('notes'),
            project_id=data.get('project_id'),
            event_id=data.get('event_id'),
            meeting_id=data.get('meeting_id'),
            recorded_by=current_user_id
        )
        
        db.add(expense)
        db.commit()
        db.refresh(expense)
        
        # Update project amount_spent if linked to a project
        if expense.project_id:
            project = db.query(Project).filter(Project.id == expense.project_id).first()
            if project:
                project.amount_spent = (project.amount_spent or 0) + expense.amount
                db.commit()
        
        return {"id": str(expense.id), "message": "Expense recorded"}
    
    @staticmethod
    def update_expense(db: Session, village_id: str, expense_id: str, data: dict) -> Dict:
        expense = db.query(Expense).filter(
            Expense.id == expense_id,
            Expense.village_id == village_id,
            Expense.deleted_at.is_(None)
        ).first()
        
        if not expense:
            raise NotFoundException("Expense")
        
        # Store old amount and project_id for updating project
        old_amount = expense.amount
        old_project_id = expense.project_id
        
        updatable_fields = ['description', 'amount', 'category', 'expense_date',
                           'payment_method', 'receipt_number', 'notes', 'approved_by']
        
        for field in updatable_fields:
            if field in data and data[field] is not None:
                setattr(expense, field, data[field])
        
        db.commit()
        db.refresh(expense)
        
        # Update project amount_spent if linked to a project
        # If project changed or amount changed
        if expense.project_id or old_project_id:
            # Remove from old project
            if old_project_id:
                old_project = db.query(Project).filter(Project.id == old_project_id).first()
                if old_project:
                    old_project.amount_spent = max(0, (old_project.amount_spent or 0) - old_amount)
                    db.commit()
            
            # Add to new project
            if expense.project_id:
                project = db.query(Project).filter(Project.id == expense.project_id).first()
                if project:
                    project.amount_spent = (project.amount_spent or 0) + expense.amount
                    db.commit()
        
        return {"message": "Expense updated"}
    
    @staticmethod
    def delete_expense(db: Session, village_id: str, expense_id: str) -> Dict:
        expense = db.query(Expense).filter(
            Expense.id == expense_id,
            Expense.village_id == village_id,
            Expense.deleted_at.is_(None)
        ).first()
        
        if not expense:
            raise NotFoundException("Expense")
        
        # Store project_id and amount before deletion
        project_id = expense.project_id
        amount = expense.amount
        
        expense.soft_delete()
        db.commit()
        
        # Subtract from project amount_spent if linked to a project
        if project_id:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project.amount_spent = max(0, (project.amount_spent or 0) - amount)
                db.commit()
        
        return {"message": "Expense deleted"}
    
    @staticmethod
    def get_categories(db: Session, village_id: str) -> List[Dict]:
        categories = db.query(ExpenseCategory).filter(
            ExpenseCategory.village_id == village_id,
            ExpenseCategory.is_active == True,
            ExpenseCategory.deleted_at.is_(None)
        ).all()
        
        return [{
            "id": str(c.id),
            "name": c.name,
            "description": c.description,
            "color": c.color,
            "is_active": c.is_active
        } for c in categories]
    
    @staticmethod
    def create_category(db: Session, village_id: str, data: dict, current_user_id: str) -> Dict:
        import uuid
        category = ExpenseCategory(
            id=str(uuid.uuid4()),
            village_id=village_id,
            name=data['name'],
            description=data.get('description'),
            color=data.get('color'),
            created_by=current_user_id,
            is_active=True
        )
        
        db.add(category)
        db.commit()
        db.refresh(category)
        
        return {"id": str(category.id), "message": f"Category '{category.name}' created"}
