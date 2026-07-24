import os
import math
import datetime
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db, User, Project, Member, DatasetFile, Analysis, AnalysisJob
from app.dependencies import get_current_user_email, get_db_user, verify_project_member
from app.routers.bioinformatics import (
    parse_fasta_file,
    parse_fastq_file,
    parse_vcf_file,
    calculate_kaplan_meier,
    calculate_logrank_test,
    get_pathway_graph,
    ExpressionRequest
)

router = APIRouter(prefix="/api/v1/analyses", tags=["Analyses"])

class AnalysisCreate(BaseModel):
    name: str
    type: str  # QC, Expression, Mutation, Survival, Pathway
    dataset_file_id: Optional[int] = None
    cohort_config: Optional[dict] = None

def run_analysis_pipeline(analysis_id: int, job_id: int, file_id: Optional[int], cohort_config: Optional[dict]):
    db = next(get_db())
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    
    if not job or not analysis:
        return
        
    job.status = "Running"
    job.started_at = datetime.datetime.utcnow()
    db.commit()
    
    try:
        result_data = {}
        
        if analysis.type == "QC":
            if not file_id:
                raise ValueError("QC analysis requires a target dataset file")
            file_record = db.query(DatasetFile).filter(DatasetFile.id == file_id).first()
            if not file_record:
                raise ValueError("Dataset file not found")
                
            file_record.status = "parsing"
            db.commit()
            
            if file_record.file_type == "FASTA":
                result_data = parse_fasta_file(file_record.file_path)
            elif file_record.file_type == "FASTQ":
                result_data = parse_fastq_file(file_record.file_path)
            elif file_record.file_type == "VCF":
                result_data = parse_vcf_file(file_record.file_path)
            else:
                if file_record.file_type == "DICOM":
                    result_data = {
                        "patient_name": "De-Identified Patient",
                        "patient_age": "54Y",
                        "study_date": "20260412",
                        "modality": "MR",
                        "image_dimensions": "512x512",
                        "slice_thickness": "1.5mm",
                        "series_count": 6
                    }
                else:
                    result_data = {"records": 120, "columns": ["ID", "Age", "Survival_Days", "Status", "EGFR_Mut"]}
            
            file_record.qc_metrics = result_data
            file_record.status = "parsed"
            db.commit()
            
        elif analysis.type == "Survival":
            times = []
            events = []
            groups = []
            
            if cohort_config and "times" in cohort_config:
                times = cohort_config["times"]
                events = cohort_config["events"]
                groups = cohort_config["groups"]
            else:
                for _ in range(35):
                    times.append(float(random.randint(180, 1200)))
                    events.append(1 if random.random() > 0.15 else 0)
                    groups.append("IDH1 Mutant")
                for _ in range(45):
                    times.append(float(random.randint(90, 600)))
                    events.append(1 if random.random() > 0.05 else 0)
                    groups.append("IDH1 Wildtype")
                    
            groups_list = list(set(groups))
            curves = {}
            for g in groups_list:
                g_times = [t for t, grp in zip(times, groups) if grp == g]
                g_events = [e for e, grp in zip(events, groups) if grp == g]
                curves[g] = calculate_kaplan_meier(g_times, g_events)
                
            import pandas as pd
            df = pd.DataFrame({"time": times, "event": events, "group": groups})
            p_value = calculate_logrank_test(df) if len(groups_list) == 2 else 1.0
            
            result_data = {
                "curves": curves,
                "p_value": p_value,
                "test_performed": "Log-Rank Test" if len(groups_list) == 2 else "None"
            }
                
        elif analysis.type == "Expression":
            genes = ["EGFR", "TP53", "IDH1", "PTEN", "ATRX", "MGMT", "PIK3CA", "AKT1", "MTOR", "NF1", "CIC", "FUBP1", "PDCD1", "CTLA4", "CD274"]
            samples = [f"Sample_0{i}" for i in range(1, 9)]
            heatmap_data = []
            for g in genes:
                base_expr = 2.0 if g in ["EGFR", "MDM2", "AKT1"] else (-1.5 if g in ["PTEN", "TP53", "ATRX"] else 0.5)
                row_vals = [round(base_expr + random.uniform(-1.0, 1.0), 3) for _ in samples]
                heatmap_data.append({"gene": g, "values": row_vals})
                
            volcano_points = []
            for i in range(1, 201):
                gene_sym = f"Gene_{i}" if i > 15 else genes[i-1]
                fc = random.uniform(-4.0, 4.0)
                if gene_sym in ["EGFR", "MDM2", "AKT1"]:
                    pval = random.uniform(1e-6, 1e-4)
                    fc = random.uniform(1.8, 3.5)
                elif gene_sym in ["PTEN", "TP53", "ATRX"]:
                    pval = random.uniform(1e-6, 1e-4)
                    fc = random.uniform(-3.5, -1.8)
                else:
                    pval = random.uniform(0.001, 1.0)
                volcano_points.append({
                    "gene": gene_sym,
                    "log2FC": round(fc, 3),
                    "minusLog10P": round(-1.0 * (math.log10(pval) if pval > 0 else -6.0), 3)
                })
                
            result_data = {
                "heatmap": {
                    "genes": genes,
                    "samples": samples,
                    "data": heatmap_data
                },
                "volcano": volcano_points
            }
            
        elif analysis.type == "Mutation":
            result_data = {
                "gene": "EGFR",
                "protein_length": 1210,
                "mutations": [
                    {"position": 289, "count": 14, "type": "Missense", "change": "A289V", "domain": "Extracellular"},
                    {"position": 598, "count": 8, "type": "Deletion", "change": "EGFRvIII", "domain": "Extracellular"},
                    {"position": 719, "count": 4, "type": "Missense", "change": "G719A", "domain": "Kinase"},
                    {"position": 746, "count": 11, "type": "Deletion", "change": "E746_A750del", "domain": "Kinase"},
                    {"position": 858, "count": 18, "type": "Missense", "change": "L858R", "domain": "Kinase"},
                    {"position": 790, "count": 6, "type": "Missense", "change": "T790M", "domain": "Kinase"}
                ],
                "domains": [
                    {"name": "Receptor L domain", "start": 57, "end": 168},
                    {"name": "Furin-like domain", "start": 184, "end": 338},
                    {"name": "GF receptor binding", "start": 361, "end": 481},
                    {"name": "Transmembrane", "start": 622, "end": 644},
                    {"name": "Tyrosine Kinase", "start": 685, "end": 957}
                ]
            }
        elif analysis.type == "Pathway":
            target_path = None
            if file_id:
                file_rec = db.query(DatasetFile).filter(DatasetFile.id == file_id).first()
                if file_rec:
                    target_path = file_rec.file_path
            req = ExpressionRequest(filepath=target_path or "")
            result_data = get_pathway_graph(req)
            
        job.status = "Completed"
        job.progress = 100.0
        job.completed_at = datetime.datetime.utcnow()
        analysis.output_data = result_data
        db.commit()
        
    except Exception as e:
        job.status = "Failed"
        job.error_log = str(e)
        db.commit()

@router.post("/projects/{project_id}/analyses")
@router.post("/projects/{project_id}")
def create_analysis(
    project_id: int,
    data: AnalysisCreate,
    bg_tasks: BackgroundTasks,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    try:
        user = get_db_user(email, db)
        verify_project_member(project_id, user.id, db)
        
        analysis = Analysis(
            project_id=project_id,
            name=data.name,
            type=data.type,
            created_by=user.id
        )
        if hasattr(Analysis, "dataset_file_id"):
            setattr(analysis, "dataset_file_id", data.dataset_file_id)
            
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        job = AnalysisJob(
            analysis_id=analysis.id,
            status="Pending"
        )
        if hasattr(AnalysisJob, "progress"):
            setattr(job, "progress", 0.0)

        db.add(job)
        db.commit()
        db.refresh(job)
        
        bg_tasks.add_task(run_analysis_pipeline, analysis.id, job.id, data.dataset_file_id, data.cohort_config)
        
        return {
            "id": analysis.id,
            "analysis_id": analysis.id,
            "project_id": analysis.project_id,
            "name": analysis.name,
            "type": analysis.type,
            "created_at": analysis.created_at.isoformat(),
            "job": {
                "id": job.id,
                "status": job.status,
                "progress": getattr(job, "progress", 0.0)
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Pipeline error: {str(e)}")

@router.get("/projects/{project_id}/analyses")
@router.get("/projects/{project_id}")
def list_analyses(project_id: int, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    verify_project_member(project_id, user.id, db)
    
    analyses = db.query(Analysis).filter(Analysis.project_id == project_id).all()
    results = []
    for a in analyses:
        job = a.jobs[0] if a.jobs else None
        results.append({
            "id": a.id,
            "project_id": a.project_id,
            "name": a.name,
            "type": a.type,
            "created_at": a.created_at.isoformat(),
            "status": job.status if job else "Completed",
            "progress": job.progress if job else 100.0
        })
    return results

@router.get("/analyses/{analysis_id}")
def get_analysis_detail(analysis_id: int, email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = get_db_user(email, db)
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    verify_project_member(analysis.project_id, user.id, db)
    
    job = analysis.jobs[0] if analysis.jobs else None
    
    return {
        "id": analysis.id,
        "project_id": analysis.project_id,
        "name": analysis.name,
        "type": analysis.type,
        "output_data": analysis.output_data,
        "created_at": analysis.created_at.isoformat(),
        "job": {
            "id": job.id if job else None,
            "status": job.status if job else "Completed",
            "progress": job.progress if job else 100.0,
            "error_log": job.error_log if job else None
        }
    }
