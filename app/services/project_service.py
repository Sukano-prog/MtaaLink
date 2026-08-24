from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime, date
from app.core.exceptions import NotFoundException
from app.models.project import Project, ProjectMilestone, ProjectTask, ProjectContribution
from app.models.member import Member
from app.models.meeting import Meeting

class ProjectService:
    
    @staticmethod
    def calculate_project_progress(db: Session, project_id: str) -> int:
        """Auto-calculate project progress based on milestones and tasks"""
        milestones = db.query(ProjectMilestone).filter(
            ProjectMilestone.project_id == project_id,
            ProjectMilestone.deleted_at.is_(None)
        ).all()
        
        if not milestones:
            # If no milestones, check if there are tasks directly
            tasks = db.query(ProjectTask).filter(
                ProjectTask.project_id == project_id,
                ProjectTask.deleted_at.is_(None)
            ).all()
            
            if tasks:
                completed = sum(1 for t in tasks if t.status == 'completed')
                return int((completed / len(tasks)) * 100) if tasks else 0
            return 0
        
        total_weight = sum(m.weight for m in milestones)
        if total_weight == 0:
            # If no weights assigned, equal distribution
            total_weight = len(milestones) * 100
        
        completed_weight = 0
        for milestone in milestones:
            if milestone.status == 'completed':
                completed_weight += milestone.weight
            else:
                # Check tasks within milestone
                tasks = db.query(ProjectTask).filter(
                    ProjectTask.milestone_id == milestone.id,
                    ProjectTask.deleted_at.is_(None)
                ).all()
                if tasks:
                    completed = sum(1 for t in tasks if t.status == 'completed')
                    milestone_progress = (completed / len(tasks)) * 100
                    completed_weight += (milestone_progress / 100) * milestone.weight
        
        progress = int((completed_weight / total_weight) * 100)
        return min(100, progress)
    
    @staticmethod
    def get_projects(db: Session, village_id: str, status: Optional[str] = None, search: Optional[str] = None) -> List[Dict]:
        query = db.query(Project).filter(
            Project.village_id == village_id,
            Project.deleted_at.is_(None)
        )
        
        if status:
            query = query.filter(Project.status == status)
        
        projects = query.order_by(Project.created_at.desc()).all()
        
        result = []
        for p in projects:
            lead = db.query(Member).filter(Member.id == p.project_lead).first()
            
            # Count tasks
            task_count = db.query(ProjectTask).filter(
                ProjectTask.project_id == p.id,
                ProjectTask.deleted_at.is_(None)
            ).count()
            
            completed_tasks = db.query(ProjectTask).filter(
                ProjectTask.project_id == p.id,
                ProjectTask.status == 'completed',
                ProjectTask.deleted_at.is_(None)
            ).count()
            
            # Get milestones
            milestones = db.query(ProjectMilestone).filter(
                ProjectMilestone.project_id == p.id,
                ProjectMilestone.deleted_at.is_(None)
            ).all()
            
            milestone_count = len(milestones)
            completed_milestones = sum(1 for m in milestones if m.status == 'completed')
            
            # Calculate progress
            progress = ProjectService.calculate_project_progress(db, p.id)
            
            result.append({
                "id": str(p.id),
                "title": p.title,
                "description": p.description,
                "status": p.status,
                "priority": p.priority,
                "budget": float(p.budget),
                "amount_spent": float(p.amount_spent),
                "progress": progress,
                "lead_name": lead.full_name if lead else None,
                "start_date": p.start_date.isoformat() if p.start_date else None,
                "end_date": p.end_date.isoformat() if p.end_date else None,
                "task_count": task_count,
                "completed_tasks": completed_tasks,
                "milestone_count": milestone_count,
                "completed_milestones": completed_milestones,
                "created_at": p.created_at.isoformat()
            })
        
        return result
    
    @staticmethod
    def get_project(db: Session, village_id: str, project_id: str) -> Dict:
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.village_id == village_id,
            Project.deleted_at.is_(None)
        ).first()
        
        if not project:
            raise NotFoundException("Project")
        
        lead = db.query(Member).filter(Member.id == project.project_lead).first()
        creator = db.query(Member).filter(Member.id == project.created_by).first()
        
        # Get milestones with tasks
        milestones = db.query(ProjectMilestone).filter(
            ProjectMilestone.project_id == project_id,
            ProjectMilestone.deleted_at.is_(None)
        ).order_by(ProjectMilestone.order).all()
        
        milestone_list = []
        for m in milestones:
            tasks = db.query(ProjectTask).filter(
                ProjectTask.milestone_id == m.id,
                ProjectTask.deleted_at.is_(None)
            ).all()
            
            task_list = [{
                "id": str(t.id),
                "title": t.title,
                "description": t.description,
                "assigned_to": t.assigned_to,
                "status": t.status,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "priority": t.priority
            } for t in tasks]
            
            milestone_list.append({
                "id": str(m.id),
                "title": m.title,
                "description": m.description,
                "weight": m.weight,
                "status": m.status,
                "due_date": m.due_date.isoformat() if m.due_date else None,
                "order": m.order,
                "tasks": task_list
            })
        
        # Calculate progress
        progress = ProjectService.calculate_project_progress(db, project_id)
        
        return {
            "id": str(project.id),
            "title": project.title,
            "description": project.description,
            "status": project.status,
            "priority": project.priority,
            "budget": float(project.budget),
            "amount_spent": float(project.amount_spent),
            "progress": progress,
            "lead_name": lead.full_name if lead else None,
            "creator_name": creator.full_name if creator else None,
            "start_date": project.start_date.isoformat() if project.start_date else None,
            "end_date": project.end_date.isoformat() if project.end_date else None,
            "expected_completion": project.expected_completion.isoformat() if project.expected_completion else None,
            "created_at": project.created_at.isoformat(),
            "milestones": milestone_list
        }
    
    @staticmethod
    def create_project(db: Session, village_id: str, data: dict, current_user_id: str) -> Dict:
        project = Project(
            village_id=village_id,
            title=data['title'],
            description=data.get('description'),
            status=data.get('status', 'planning'),
            priority=data.get('priority', 'medium'),
            budget=data.get('budget', 0),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            expected_completion=data.get('expected_completion'),
            project_lead=data.get('project_lead'),
            meeting_id=data.get('meeting_id'),
            created_by=current_user_id
        )
        
        db.add(project)
        db.commit()
        db.refresh(project)
        
        return {"id": str(project.id), "message": f"Project '{project.title}' created"}
    
    @staticmethod
    def update_project(db: Session, village_id: str, project_id: str, data: dict) -> Dict:
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.village_id == village_id,
            Project.deleted_at.is_(None)
        ).first()
        
        if not project:
            raise NotFoundException("Project")
        
        updatable_fields = ['title', 'description', 'status', 'priority', 'budget', 
                           'amount_spent', 'start_date', 'end_date', 'expected_completion',
                           'project_lead', 'progress']
        
        for field in updatable_fields:
            if field in data and data[field] is not None:
                setattr(project, field, data[field])
        
        db.commit()
        db.refresh(project)
        
        return {"message": f"Project '{project.title}' updated"}
    
    @staticmethod
    def delete_project(db: Session, village_id: str, project_id: str) -> Dict:
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.village_id == village_id,
            Project.deleted_at.is_(None)
        ).first()
        
        if not project:
            raise NotFoundException("Project")
        
        if project.status not in ['planning', 'on_hold']:
            raise ValueError("Only planning or on-hold projects can be deleted")
        
        project.soft_delete()
        db.commit()
        
        return {"message": f"Project '{project.title}' deleted"}
    
    @staticmethod
    def add_milestone(db: Session, project_id: str, data: dict) -> Dict:
        milestone = ProjectMilestone(
            project_id=project_id,
            title=data['title'],
            description=data.get('description'),
            due_date=data.get('due_date'),
            weight=data.get('weight', 0),
            order=data.get('order', 0)
        )
        
        db.add(milestone)
        db.commit()
        db.refresh(milestone)
        
        return {"id": str(milestone.id), "message": f"Milestone '{milestone.title}' created"}
    
    @staticmethod
    def update_milestone(db: Session, milestone_id: str, data: dict) -> Dict:
        milestone = db.query(ProjectMilestone).filter(
            ProjectMilestone.id == milestone_id,
            ProjectMilestone.deleted_at.is_(None)
        ).first()
        
        if not milestone:
            raise NotFoundException("Milestone")
        
        updatable_fields = ['title', 'description', 'due_date', 'weight', 'status', 'order']
        
        for field in updatable_fields:
            if field in data and data[field] is not None:
                setattr(milestone, field, data[field])
        
        # If milestone is completed, set completed_at
        if data.get('status') == 'completed' and milestone.status != 'completed':
            milestone.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(milestone)
        
        return {"message": f"Milestone '{milestone.title}' updated"}
    
    @staticmethod
    def delete_milestone(db: Session, milestone_id: str) -> Dict:
        milestone = db.query(ProjectMilestone).filter(
            ProjectMilestone.id == milestone_id,
            ProjectMilestone.deleted_at.is_(None)
        ).first()
        
        if not milestone:
            raise NotFoundException("Milestone")
        
        milestone.soft_delete()
        db.commit()
        
        return {"message": "Milestone deleted"}
    
    @staticmethod
    def add_task(db: Session, project_id: str, data: dict) -> Dict:
        task = ProjectTask(
            project_id=project_id,
            milestone_id=data.get('milestone_id'),
            title=data['title'],
            description=data.get('description'),
            assigned_to=data.get('assigned_to'),
            due_date=data.get('due_date'),
            priority=data.get('priority', 'medium')
        )
        
        db.add(task)
        db.commit()
        db.refresh(task)
        
        return {"id": str(task.id), "message": f"Task '{task.title}' created"}
    
    @staticmethod
    def update_task(db: Session, task_id: str, data: dict) -> Dict:
        task = db.query(ProjectTask).filter(
            ProjectTask.id == task_id,
            ProjectTask.deleted_at.is_(None)
        ).first()
        
        if not task:
            raise NotFoundException("Task")
        
        updatable_fields = ['title', 'description', 'assigned_to', 'due_date', 'status', 'priority']
        
        for field in updatable_fields:
            if field in data and data[field] is not None:
                setattr(task, field, data[field])
        
        # If task is completed, set completed_at
        if data.get('status') == 'completed' and task.status != 'completed':
            task.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(task)
        
        return {"message": f"Task '{task.title}' updated"}
    
    @staticmethod
    def delete_task(db: Session, task_id: str) -> Dict:
        task = db.query(ProjectTask).filter(
            ProjectTask.id == task_id,
            ProjectTask.deleted_at.is_(None)
        ).first()
        
        if not task:
            raise NotFoundException("Task")
        
        task.soft_delete()
        db.commit()
        
        return {"message": "Task deleted"}

    @staticmethod
    def complete_project(db: Session, village_id: str, project_id: str) -> Dict:
        """Mark project as completed"""
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.village_id == village_id,
            Project.deleted_at.is_(None)
        ).first()
        
        if not project:
            raise NotFoundException("Project not found")
        
        project.status = 'completed'
        project.progress = 100
        project.end_date = date.today()
        
        db.commit()
        db.refresh(project)
        
        return {
            "id": project.id,
            "status": project.status,
            "progress": project.progress,
            "end_date": project.end_date.isoformat() if project.end_date else None,
            "message": "Project marked as completed"
        }
