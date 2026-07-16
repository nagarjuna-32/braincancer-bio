import os
import sys
import shutil
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt, JWTError
from sqlalchemy.orm import Session

# Add project root to PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from app.database import get_db, User, Project, Member, Dataset, DatasetFile, init_db

app = FastAPI(title="NeuroGen AI - Dataset Service")

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

# Base directory to store dataset files
STORAGE_DIR = os.getenv("STORAGE_DIR", "storage/datasets")
os.makedirs(STORAGE_DIR, exist_ok=True)

class DatasetCreate(BaseModel):
    name: str
    type: str  # Genomic, Transcriptomic, Imaging, Clinical

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

@app.post("/projects/{project_id}/datasets")
def create_dataset(project_id: int, data: DatasetCreate, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    verify_project_member(project_id, user.id, db)
    
    dataset = Dataset(
        project_id=project_id,
        name=data.name,
        type=data.type,
        created_by=user.id
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    return {
        "id": dataset.id,
        "project_id": dataset.project_id,
        "name": dataset.name,
        "type": dataset.type,
        "created_at": dataset.created_at.isoformat()
    }

@app.get("/projects/{project_id}/datasets")
def list_datasets(project_id: int, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    verify_project_member(project_id, user.id, db)
    
    datasets = db.query(Dataset).filter(Dataset.project_id == project_id).all()
    results = []
    for d in datasets:
        results.append({
            "id": d.id,
            "project_id": d.project_id,
            "name": d.name,
            "type": d.type,
            "created_at": d.created_at.isoformat(),
            "file_count": len(d.files)
        })
    return results

@app.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: int, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    verify_project_member(dataset.project_id, user.id, db)
    
    files = []
    for f in dataset.files:
        files.append({
            "id": f.id,
            "filename": f.filename,
            "file_size": f.file_size,
            "file_type": f.file_type,
            "status": f.status,
            "qc_metrics": f.qc_metrics,
            "created_at": f.created_at.isoformat()
        })
        
    return {
        "id": dataset.id,
        "project_id": dataset.project_id,
        "name": dataset.name,
        "type": dataset.type,
        "created_at": dataset.created_at.isoformat(),
        "files": files
    }

@app.post("/datasets/{dataset_id}/upload")
async def upload_dataset_file(
    dataset_id: int,
    file: UploadFile = File(...),
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    user = get_db_user(email, db)
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    verify_project_member(dataset.project_id, user.id, db)
    
    # Identify extension/type
    filename = file.filename
    ext = filename.split(".")[-1].upper() if "." in filename else ""
    
    # Map extension to supported types
    supported_types = {
        "FA": "FASTA", "FASTA": "FASTA",
        "FQ": "FASTQ", "FASTQ": "FASTQ",
        "CSV": "CSV",
        "XLSX": "Excel", "XLS": "Excel",
        "VCF": "VCF",
        "BAM": "BAM",
        "DCM": "DICOM", "DICOM": "DICOM",
        "PDF": "PDF"
    }
    
    file_type = supported_types.get(ext, "CSV") # Fallback to CSV
    
    # Create directory for dataset if not exists
    dataset_dir = os.path.join(STORAGE_DIR, f"dataset_{dataset_id}")
    os.makedirs(dataset_dir, exist_ok=True)
    
    target_path = os.path.join(dataset_dir, filename)
    
    # Save file
    file_size = 0
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(target_path)
    
    # Initialize basic metadata (will be parsed in detail by Bioinformatics / Analysis service)
    # We populate some default mock qc_metrics immediately so UI has data if bioinformatics is busy
    default_qc = {
        "format": file_type,
        "lines": 0,
        "notes": "Pending deep bioinformatics parsing..."
    }
    
    db_file = DatasetFile(
        dataset_id=dataset_id,
        filename=filename,
        file_path=target_path,
        file_size=file_size,
        file_type=file_type,
        status="uploaded",
        qc_metrics=default_qc
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    # Return file details
    return {
        "id": db_file.id,
        "dataset_id": db_file.dataset_id,
        "filename": db_file.filename,
        "file_size": db_file.file_size,
        "file_type": db_file.file_type,
        "status": db_file.status,
        "qc_metrics": db_file.qc_metrics,
        "created_at": db_file.created_at.isoformat()
    }
