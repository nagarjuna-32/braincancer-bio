from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db, User, Notification, AuditLog
from app.dependencies import get_current_user_email, get_db_user

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str

class AuditLogCreate(BaseModel):
    action: str
    target_type: str
    target_id: Optional[int] = None

@router.post("/notifications")
def create_notification(data: NotificationCreate, db: Session = Depends(get_db)):
    notif = Notification(
        user_id=data.user_id,
        title=data.title,
        message=data.message,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return {"message": "Notification created successfully", "id": notif.id}

@router.get("/notifications")
def list_notifications(email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    notifs = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.id.desc()).all()
    results = []
    for n in notifs:
        results.append({
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        })
    return results

@router.post("/notifications/{notif_id}/read")
def mark_read(notif_id: int, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    n = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == user.id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.post("/audit-logs")
def write_audit_log(data: AuditLogCreate, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    log = AuditLog(
        user_id=user.id,
        action=data.action,
        target_type=data.target_type,
        target_id=data.target_id
    )
    db.add(log)
    db.commit()
    return {"message": "Audit log recorded"}

@router.get("/audit-logs")
def list_audit_logs(email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    if user.role not in ["Professor", "Lab"]:
         raise HTTPException(status_code=403, detail="Not authorized to view system logs")
         
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(100).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "user_email": l.user.email if l.user else "System",
            "action": l.action,
            "target_type": l.target_type,
            "timestamp": l.timestamp.isoformat()
        })
    return results
