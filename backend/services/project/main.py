import os
import sys
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt, JWTError
from sqlalchemy.orm import Session

# Add project root to PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from app.database import get_db, User, Project, Member, init_db

app = FastAPI(title="NeuroGen AI - Project Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("JWT_SECRET", "neurogen_secret_key_2026")
ALGORITHM = "HS256"
security = HTTPBearer()

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

class MemberAdd(BaseModel):
    email: str
    role: str = "Collaborator"  # Supervise, Collaborator, Reader

class UserRef(BaseModel):
    id: int
    email: str
    full_name: str
    role: str

class MemberResponse(BaseModel):
    id: int
    project_id: int
    role: str
    user: UserRef

    class Config:
        from_attributes = True

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        # Here we just return the email or lookup in DB. To be quick, we decode payload and query user ID.
    except JWTError:
        raise credentials_exception
    return email

def get_db_user(email: str, db: Session) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.on_event("startup")
def on_startup():
    init_db()

@app.post("/projects")
def create_project(data: ProjectCreate, email: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    
    project = Project(
        name=data.name,
        description=data.description,
        organization_id=user.organization_id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # Add creator as Owner member
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

@app.get("/projects")
def list_projects(email: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    
    # Fetch projects where user is a member
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

@app.get("/projects/{project_id}")
def get_project(project_id: int, email: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    
    # Verify membership
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

@app.post("/projects/{project_id}/members")
def add_member(project_id: int, data: MemberAdd, email: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    current_u = get_db_user(email, db)
    
    # Verify current user is Owner or Supervise role
    member = db.query(Member).filter(Member.project_id == project_id, Member.user_id == current_u.id).first()
    if not member or member.role not in ["Owner", "Supervise"]:
        raise HTTPException(status_code=403, detail="Only project Owners or Supervisors can add members")
        
    # Check if target user exists
    target_user = db.query(User).filter(User.email == data.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User with this email not found")
        
    # Check if already a member
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

@app.get("/projects/{project_id}/members")
def list_members(project_id: int, email: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    
    # Verify membership
    member = db.query(Member).filter(Member.project_id == project_id, Member.user_id == user.id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized to view members of this project")
        
    members = db.query(Member).filter(Member.project_id == project_id).all()
    results = []
    for m in members:
        u = m.user
        results.append({
            "id": m.id,
            "project_id": m.project_id,
            "role": m.role,
            "user": {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role
            }
        })
    return results

@app.delete("/projects/{project_id}/members/{user_id}")
def remove_member(project_id: int, user_id: int, email: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    current_u = get_db_user(email, db)
    
    # Verify current user is Owner
    member = db.query(Member).filter(Member.project_id == project_id, Member.user_id == current_u.id).first()
    if not member or member.role != "Owner":
        raise HTTPException(status_code=403, detail="Only project Owners can remove members")
        
    # Prevent self removal
    if current_u.id == user_id:
        raise HTTPException(status_code=400, detail="Owners cannot remove themselves. Delete project instead.")
        
    target_member = db.query(Member).filter(Member.project_id == project_id, Member.user_id == user_id).first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    db.delete(target_member)
    db.commit()
    return {"message": "Member removed successfully"}
