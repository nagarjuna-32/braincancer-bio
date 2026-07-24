from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db, User, Report
from app.dependencies import get_current_user_email, get_db_user, verify_project_member

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])

class ReportCreate(BaseModel):
    name: str
    content: str
    format: str = "PDF"  # PDF, Word, Excel

@router.post("/projects/{project_id}/reports")
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

@router.get("/projects/{project_id}/reports")
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

@router.get("/reports/{report_id}")
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

@router.get("/reports/{report_id}/download")
def download_report(report_id: int, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    verify_project_member(report.project_id, user.id, db)
    
    return {
        "filename": f"{report.name.replace(' ', '_').lower()}.{report.format.lower()}",
        "mime_type": "application/pdf" if report.format == "PDF" else ("application/vnd.openxmlformats-officedocument.wordprocessingml.document" if report.format == "Word" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        "raw_data": report.content
    }
