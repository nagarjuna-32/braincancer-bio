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
from app.database import get_db, User, Notification, AuditLog, init_db

app = FastAPI(title="NeuroGen AI - Notification Service")

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

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str

class AuditLogCreate(BaseModel):
    action: str
    target_type: str
    target_id: Optional[int] = None

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

@app.on_event("startup")
def on_startup():
    init_db()

@app.post("/notifications")
def create_notification(data: NotificationCreate, db: Session = Depends(get_db)):
    # This can be triggered internally by other microservices when background pipeline is completed
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

@app.get("/notifications")
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

@app.post("/notifications/{notif_id}/read")
def mark_read(notif_id: int, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    n = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == user.id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@app.post("/audit-logs")
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

@app.get("/audit-logs")
def list_audit_logs(email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    # Only allow Admin / Supervisors to see audit logs
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
