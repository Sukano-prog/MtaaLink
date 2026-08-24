from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from decimal import Decimal
from app.core.exceptions import NotFoundException
from app.models.contribution import Contribution, ContributionType
from app.models.member import Member

class ContributionService:
    @staticmethod
    def get_contributions(db: Session, village_id: str, member_id: Optional[str] = None,
                         status: Optional[str] = None, search: Optional[str] = None) -> Dict:
        query = db.query(Contribution).filter(
            Contribution.village_id == village_id,
            Contribution.deleted_at.is_(None)
        )
        
        if member_id:
            query = query.filter(Contribution.member_id == member_id)
        
        if status:
            query = query.filter(Contribution.status == status)
        if search:
            # Search by member name
            query = query.join(Member, Contribution.member_id == Member.id).filter(
                Member.first_name.ilike(f'%{search}%') | 
                Member.last_name.ilike(f'%{search}%')
            )
        
        contributions = query.all()
        
        result = []
        total_amount = Decimal('0')
        total_paid = Decimal('0')
        
        for c in contributions:
            member = db.query(Member).filter(Member.id == c.member_id).first()
            type_name = None
            if c.contribution_type_id:
                ct = db.query(ContributionType).filter(ContributionType.id == c.contribution_type_id).first()
                if ct:
                    type_name = ct.name
            
            result.append({
                "id": str(c.id),
                "member_id": str(c.member_id),
                "member_name": member.full_name if member else "Unknown",
                "contribution_type_name": type_name,
                "amount": float(c.amount),
                "paid_amount": float(c.paid_amount),
                "balance": float(c.balance),
                "status": c.status,
                "due_date": c.due_date.isoformat() if c.due_date else None,
                "receipt_number": c.receipt_number
            })
            
            total_amount += c.amount
            total_paid += c.paid_amount
        
        return {
            "contributions": result,
            "total": len(result),
            "total_amount": float(total_amount),
            "total_paid": float(total_paid)
        }
    
    @staticmethod
    def create_contribution(db: Session, village_id: str, data: dict, current_user_id: str) -> Dict:
        member = db.query(Member).filter(
            Member.id == data['member_id'],
            Member.village_id == village_id
        ).first()
        
        if not member:
            raise NotFoundException("Member")
        
        contribution = Contribution(
            village_id=village_id,
            member_id=data['member_id'],
            contribution_type_id=data.get('contribution_type_id'),
            amount=data['amount'],
            due_date=data.get('due_date'),
            payment_method=data.get('payment_method'),
            notes=data.get('notes'),
            recorded_by=current_user_id
        )
        
        db.add(contribution)
        db.commit()
        db.refresh(contribution)
        
        return {"id": str(contribution.id), "message": "Contribution recorded"}
    
    @staticmethod
    def get_types(db: Session, village_id: str) -> List[Dict]:
        types = db.query(ContributionType).filter(
            ContributionType.village_id == village_id,
            ContributionType.is_active == True,
            ContributionType.deleted_at.is_(None)
        ).all()
        
        return [{
            "id": str(t.id),
            "name": t.name,
            "description": t.description,
            "icon": t.icon,
            "color": t.color,
            "category": t.category
        } for t in types]
    
    @staticmethod
    def create_type(db: Session, village_id: str, data: dict) -> Dict:
        ct = ContributionType(
            village_id=village_id,
            name=data['name'],
            description=data.get('description'),
            icon=data.get('icon'),
            color=data.get('color'),
            category=data.get('category', 'general')
        )
        
        db.add(ct)
        db.commit()
        db.refresh(ct)
        
        return {"id": str(ct.id), "message": f"Type '{ct.name}' created"}

    @staticmethod
    def update_type(db: Session, village_id: str, type_id: str, data: dict) -> Dict:
        """Update an existing contribution type"""
        ct = db.query(ContributionType).filter(
            ContributionType.id == type_id,
            ContributionType.village_id == village_id,
            ContributionType.deleted_at.is_(None)
        ).first()
        
        if not ct:
            raise NotFoundException("Contribution type")
        
        for field, value in data.items():
            if value is not None and hasattr(ct, field):
                setattr(ct, field, value)
        
        db.commit()
        db.refresh(ct)
        
        return {"id": str(ct.id), "message": f"Type '{ct.name}' updated"}
    
    @staticmethod
    def delete_type(db: Session, village_id: str, type_id: str) -> Dict:
        """Soft delete a contribution type"""
        ct = db.query(ContributionType).filter(
            ContributionType.id == type_id,
            ContributionType.village_id == village_id,
            ContributionType.deleted_at.is_(None)
        ).first()
        
        if not ct:
            raise NotFoundException("Contribution type")
        
        ct.soft_delete()
        ct.is_active = False
        db.commit()
        
        return {"message": f"Type '{ct.name}' deleted"}

    @staticmethod
    def update_contribution(db: Session, village_id: str, contribution_id: str, data: dict) -> Dict:
        """Update a contribution (e.g., record payment)"""
        contribution = db.query(Contribution).filter(
            Contribution.id == contribution_id,
            Contribution.village_id == village_id,
            Contribution.deleted_at.is_(None)
        ).first()
        
        if not contribution:
            raise NotFoundException("Contribution")
        
        # Update fields
        updatable_fields = ['paid_amount', 'status', 'payment_method', 'payment_reference', 'notes']
        for field in updatable_fields:
            if field in data and data[field] is not None:
                setattr(contribution, field, data[field])
        
        # Recalculate balance
        if 'paid_amount' in data:
            contribution.balance = contribution.amount - contribution.paid_amount
        
        db.commit()
        db.refresh(contribution)
        
        return {"message": "Contribution updated successfully"}
    
    @staticmethod
    def delete_contribution(db: Session, village_id: str, contribution_id: str) -> Dict:
        """Soft delete a contribution"""
        contribution = db.query(Contribution).filter(
            Contribution.id == contribution_id,
            Contribution.village_id == village_id,
            Contribution.deleted_at.is_(None)
        ).first()
        
        if not contribution:
            raise NotFoundException("Contribution")
        
        # Only allow deletion if not paid
        if contribution.status == 'paid':
            raise ValueError("Cannot delete a paid contribution")
        
        contribution.soft_delete()
        db.commit()
        
        return {"message": "Contribution deleted successfully"}
