import os
import sys
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt, JWTError
from sqlalchemy.orm import Session

# Add project root to PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from app.database import get_db, User, Member, Report, Project, init_db

app = FastAPI(title="NeuroGen AI - Report Service")

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

class ReportCreate(BaseModel):
    name: str
    content: str
    format: str = "PDF"  # PDF, Word, Excel

def get_current_user_email(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return email

def get_db_user(email: str, db: Session) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def verify_project_member(project_id: int, user_id: int, db: Session) -> Member:
    member = db.query(Member).filter(Member.project_id == project_id, Member.user_id == user_id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized to access this project")
    return member

@app.on_event("startup")
def on_startup():
    init_db()

@app.post("/projects/{project_id}/reports")
def create_report(project_id: int, data: ReportCreate, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    verify_project_member(project_id, user.id, db)
    
    report = Report(
        project_id=project_id,
        name=data.name,
        content=data.content,
        format=data.format,
        created_by=user.id
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return {
        "id": report.id,
        "project_id": report.project_id,
        "name": report.name,
        "content": report.content,
        "format": report.format,
        "created_at": report.created_at.isoformat()
    }

@app.get("/projects/{project_id}/reports")
def list_reports(project_id: int, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    verify_project_member(project_id, user.id, db)
    
    reports = db.query(Report).filter(Report.project_id == project_id).all()
    results = []
    for r in reports:
        results.append({
            "id": r.id,
            "name": r.name,
            "format": r.format,
            "created_at": r.created_at.isoformat(),
            "created_by": r.created_by
        })
    return results

@app.get("/reports/{report_id}")
def get_report(report_id: int, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    verify_project_member(report.project_id, user.id, db)
    
    return {
        "id": report.id,
        "project_id": report.project_id,
        "name": report.name,
        "content": report.content,
        "format": report.format,
        "created_at": report.created_at.isoformat()
    }

@app.get("/reports/{report_id}/download")
def download_report(report_id: int, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    # Simulates report content packaging for download. In a production system, this could invoke WeasyPrint or reportlab to build PDFs.
    user = get_db_user(email, db)
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    verify_project_member(report.project_id, user.id, db)
    
    # We will return the plain content with a flag, which the frontend will serialize into a downloadable file.
    return {
        "filename": f"{report.name.replace(' ', '_').lower()}.{report.format.lower()}",
        "mime_type": "application/pdf" if report.format == "PDF" else ("application/vnd.openxmlformats-officedocument.wordprocessingml.document" if report.format == "Word" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        "raw_data": report.content
    }
