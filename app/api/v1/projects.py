from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.core.exceptions import AppException
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.project_service import ProjectService
from app.models.member import Member

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])

@router.get("/")
async def get_projects(
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return ProjectService.get_projects(db, current_user.village_id, status, search)
    except AppException as e:
        raise e

@router.get("/{project_id}")
async def get_project(
    project_id: str,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return ProjectService.get_project(db, current_user.village_id, project_id)
    except AppException as e:
        raise e

@router.post("/")
async def create_project(
    data: ProjectCreate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ProjectService.create_project(db, current_user.village_id, data.dict(), current_user.id)
    except AppException as e:
        raise e

@router.put("/{project_id}")
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ProjectService.update_project(db, current_user.village_id, project_id, data.dict())
    except AppException as e:
        raise e

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ProjectService.delete_project(db, current_user.village_id, project_id)
    except AppException as e:
        raise e

# ===== MILESTONES =====

@router.post("/{project_id}/milestones")
async def add_milestone(
    project_id: str,
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ProjectService.add_milestone(db, project_id, data)
    except AppException as e:
        raise e

@router.put("/milestones/{milestone_id}")
async def update_milestone(
    milestone_id: str,
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ProjectService.update_milestone(db, milestone_id, data)
    except AppException as e:
        raise e

@router.delete("/milestones/{milestone_id}")
async def delete_milestone(
    milestone_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ProjectService.delete_milestone(db, milestone_id)
    except AppException as e:
        raise e

# ===== TASKS =====

@router.post("/{project_id}/tasks")
async def add_task(
    project_id: str,
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ProjectService.add_task(db, project_id, data)
    except AppException as e:
        raise e

@router.put("/tasks/{task_id}")
async def update_task(
    task_id: str,
    data: dict,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ProjectService.update_task(db, task_id, data)
    except AppException as e:
        raise e

@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ProjectService.delete_task(db, task_id)
    except AppException as e:
        raise e

@router.post("/{project_id}/complete/")
async def complete_project(
    project_id: str,
    current_user: Member = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return ProjectService.complete_project(db, current_user.village_id, project_id)
    except AppException as e:
        raise e
