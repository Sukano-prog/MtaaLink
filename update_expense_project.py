import re

with open('/home/laki/MtaaLink/app/services/expense_service.py', 'r') as f:
    content = f.read()

# 1. Update create_expense to add to project amount_spent
old_create = '''    @staticmethod
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
        
        return {"id": str(expense.id), "message": "Expense recorded"}'''

new_create = '''    @staticmethod
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
        
        return {"id": str(expense.id), "message": "Expense recorded"}'''

content = content.replace(old_create, new_create)

# 2. Update delete_expense to subtract from project amount_spent
old_delete = '''    @staticmethod
    def delete_expense(db: Session, village_id: str, expense_id: str) -> Dict:
        expense = db.query(Expense).filter(
            Expense.id == expense_id,
            Expense.village_id == village_id,
            Expense.deleted_at.is_(None)
        ).first()
        
        if not expense:
            raise NotFoundException("Expense")
        
        expense.soft_delete()
        db.commit()
        
        return {"message": "Expense deleted"}'''

new_delete = '''    @staticmethod
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
        
        return {"message": "Expense deleted"}'''

content = content.replace(old_delete, new_delete)

# 3. Update update_expense to handle amount changes
old_update = '''    @staticmethod
    def update_expense(db: Session, village_id: str, expense_id: str, data: dict) -> Dict:
        expense = db.query(Expense).filter(
            Expense.id == expense_id,
            Expense.village_id == village_id,
            Expense.deleted_at.is_(None)
        ).first()
        
        if not expense:
            raise NotFoundException("Expense")
        
        updatable_fields = ['description', 'amount', 'category', 'expense_date',
                           'payment_method', 'receipt_number', 'notes', 'approved_by']
        
        for field in updatable_fields:
            if field in data and data[field] is not None:
                setattr(expense, field, data[field])
        
        db.commit()
        db.refresh(expense)
        
        return {"message": "Expense updated"}'''

new_update = '''    @staticmethod
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
        
        return {"message": "Expense updated"}'''

content = content.replace(old_update, new_update)

with open('/home/laki/MtaaLink/app/services/expense_service.py', 'w') as f:
    f.write(content)
print("✅ Updated expense service to update project amount_spent")
