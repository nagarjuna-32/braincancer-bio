import os
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db, User, Dataset, DatasetFile
from app.dependencies import get_current_user_email, get_db_user, verify_project_member

router = APIRouter(prefix="/api/v1/datasets", tags=["Datasets"])

STORAGE_DIR = os.getenv("STORAGE_DIR", "storage/datasets")
os.makedirs(STORAGE_DIR, exist_ok=True)

class DatasetCreate(BaseModel):
    name: str
    type: str  # Genomic, Transcriptomic, Imaging, Clinical

@router.post("/projects/{project_id}/datasets")
def create_dataset(
    project_id: int,
    data: DatasetCreate,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
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

@router.get("/projects/{project_id}/datasets")
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

@router.get("/datasets/{dataset_id}")
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

@router.post("/datasets/{dataset_id}/upload")
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
    
    filename = file.filename
    ext = filename.split(".")[-1].upper() if "." in filename else ""
    
    supported_types = {
        "FA": "FASTA", "FASTA": "FASTA",
        "FQ": "FASTQ", "FASTQ": "FASTQ",
        "CSV": "CSV",
        "XLSX": "Excel", "XLS": "Excel",
        "VCF": "VCF",
        "BAM": "BAM",
        "DCM": "DICOM", "DICOM": "DICOM",
        "NII": "NIfTI", "NIFTI": "NIfTI", "GZ": "NIfTI",
        "PDF": "PDF"
    }
    
    file_type = supported_types.get(ext, "CSV")
    
    dataset_dir = os.path.join(STORAGE_DIR, f"dataset_{dataset_id}")
    os.makedirs(dataset_dir, exist_ok=True)
    
    target_path = os.path.join(dataset_dir, filename)
    
    file_size = 0
    with open(target_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            buffer.write(chunk)
            file_size += len(chunk)
            
    df_record = DatasetFile(
        dataset_id=dataset_id,
        filename=filename,
        file_path=target_path,
        file_size=file_size,
        file_type=file_type,
        status="uploaded"
    )
    db.add(df_record)
    db.commit()
    db.refresh(df_record)
    
    return {
        "id": df_record.id,
        "dataset_id": df_record.dataset_id,
        "filename": df_record.filename,
        "file_size": df_record.file_size,
        "file_type": df_record.file_type,
        "status": df_record.status,
        "created_at": df_record.created_at.isoformat()
    }

@router.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: int, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    verify_project_member(dataset.project_id, user.id, db)
    
    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted successfully"}
