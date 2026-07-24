from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db, User, Project, Member
from app.dependencies import get_current_user_email, get_db_user

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class MemberAdd(BaseModel):
    email: str
    role: str = "Collaborator"  # Supervise, Collaborator, Reader

@router.post("/projects")
def create_project(data: ProjectCreate, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    
    project = Project(
        name=data.name,
        description=data.description,
        organization_id=user.organization_id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    member = Member(
        project_id=project.id,
        user_id=user.id,
        role="Owner"
    )
    db.add(member)
    db.commit()
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "created_at": project.created_at.isoformat(),
        "role": "Owner"
    }

@router.get("/projects")
def list_projects(email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    memberships = db.query(Member).filter(Member.user_id == user.id).all()
    results = []
    for m in memberships:
        p = m.project
        results.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "created_at": p.created_at.isoformat(),
            "role": m.role
        })
    return results

@router.get("/projects/{project_id}")
def get_project(project_id: int, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    member = db.query(Member).filter(Member.project_id == project_id, Member.user_id == user.id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
    p = member.project
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "created_at": p.created_at.isoformat(),
        "role": member.role
    }

@router.post("/projects/{project_id}/members")
def add_member(project_id: int, data: MemberAdd, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    current_user_obj = get_db_user(email, db)
    current_member = db.query(Member).filter(Member.project_id == project_id, Member.user_id == current_user_obj.id).first()
    if not current_member or current_member.role not in ["Owner", "Supervise"]:
        raise HTTPException(status_code=403, detail="Only Owners or Supervisors can add new team members")

    target_user = db.query(User).filter(User.email == data.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail=f"User with email '{data.email}' not found")

    existing = db.query(Member).filter(Member.project_id == project_id, Member.user_id == target_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this project")

    new_member = Member(
        project_id=project_id,
        user_id=target_user.id,
        role=data.role
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return {
        "id": new_member.id,
        "project_id": new_member.project_id,
        "role": new_member.role,
        "user": {
            "id": target_user.id,
            "email": target_user.email,
            "full_name": target_user.full_name,
            "role": target_user.role
        }
    }

@router.get("/projects/{project_id}/members")
def list_members(project_id: int, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    current_user_obj = get_db_user(email, db)
    current_member = db.query(Member).filter(Member.project_id == project_id, Member.user_id == current_user_obj.id).first()
    if not current_member:
        raise HTTPException(status_code=403, detail="Not authorized to view members of this project")

    members = db.query(Member).filter(Member.project_id == project_id).all()
    results = []
    for m in members:
        u = m.user
        results.append({
            "id": m.id,
            "project_id": m.project_id,
            "role": m.role,
            "joined_at": m.joined_at.isoformat(),
            "user": {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role
            }
        })
    return results
