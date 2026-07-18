"""
NeuroGen AI - Pre-Loaded Demo Workspace Seeder
==============================================
Seeds real multi-disease research projects, datasets, analyses, and pre-computed pipeline results
so researchers can instantly demo the platform without uploading raw data.
"""

import os
import sys
import datetime

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import (
    init_db, SessionLocal, User, Organization, Project, Member,
    Dataset, DatasetFile, Analysis, AnalysisJob, Paper, Gene, Mutation, Variant
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def seed():
    print("[*] Initializing database for demo workspace seeding...")
    init_db()
    db = SessionLocal()

    # 1. Demo Organization
    org = db.query(Organization).filter(Organization.name == "National Neuro-Oncology & Genomics Institute").first()
    if not org:
        org = Organization(name="National Neuro-Oncology & Genomics Institute")
        db.add(org)
        db.commit()
        db.refresh(org)
        print(f"[+] Organization created: ID {org.id}")

    # 2. Demo User
    user = db.query(User).filter(User.email == "researcher@neurogen.ai").first()
    if not user:
        user = User(
            email="researcher@neurogen.ai",
            hashed_password=pwd_context.hash("password123"),
            full_name="Dr. Nagarjuna N",
            role="Lab Head",
            organization_id=org.id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"[+] Demo User created: {user.email}")

    # 3. Multi-Disease Demo Projects
    demo_projects = [
        {
            "name": "TCGA Glioblastoma Multi-Omic Cohort",
            "disease_type": "Brain Cancer (GBM)",
            "description": "Integration of BraTS 2023 MRI sequences, TCGA-GBM RNA-seq matrix, and somatic VCF mutations."
        },
        {
            "name": "NSCLC EGFR Targeted Immunotherapy",
            "disease_type": "Lung Cancer (NSCLC)",
            "description": "Transcriptomic profiling of Non-Small Cell Lung Cancer patients under EGFR tyrosine kinase inhibitors."
        },
        {
            "name": "Alzheimer's Amyloid Plaque Microarray Study",
            "disease_type": "Alzheimer's Disease",
            "description": "Single-cell RNA sequencing of hippocampi examining APOE e4 allele burden."
        }
    ]

    for p_info in demo_projects:
        proj = db.query(Project).filter(Project.name == p_info["name"]).first()
        if not proj:
            proj = Project(
                name=p_info["name"],
                description=p_info["description"],
                disease_type=p_info["disease_type"],
                organization_id=org.id
            )
            db.add(proj)
            db.commit()
            db.refresh(proj)

            # Add member
            mem = Member(project_id=proj.id, user_id=user.id, role="Owner")
            db.add(mem)

            # Add Dataset
            ds = Dataset(project_id=proj.id, name=f"{p_info['name']} Primary Dataset", type="Genomic", created_by=user.id)
            db.add(ds)
            db.commit()
            db.refresh(ds)

            # Add Dataset Files
            ds_file = DatasetFile(
                dataset_id=ds.id,
                filename="expression_matrix.csv",
                file_path="backend/data/expression_matrix.csv",
                file_size=1024500,
                file_type="CSV",
                status="parsed",
                qc_metrics={"total_samples": 160, "genes": 16213, "status": "PASS"}
            )
            db.add(ds_file)

            # Add Analysis & Pre-computed Job
            ana = Analysis(
                project_id=proj.id,
                name="Master End-to-End Multi-Omic Pipeline",
                type="Master Pipeline",
                status="Completed",
                created_by=user.id
            )
            db.add(ana)
            db.commit()
            db.refresh(ana)

            job = AnalysisJob(
                analysis_id=ana.id,
                status="Completed",
                result={
                    "disease_type": p_info["disease_type"],
                    "validation": {"is_valid": True, "rows": 160, "columns": ["GENE_001", "GENE_002"]},
                    "ml_inference": {"predicted_class": "High Risk Cohort", "confidence": 0.942, "who_grade": "Grade IV"},
                    "ai_explanation": {
                        "summary": f"Comprehensive multi-omic pipeline execution verified for {p_info['disease_type']}.",
                        "evidence_citations": ["[PMC26404127]: Stupp protocol", "[PMC19270080]: IDH1 mutations"]
                    }
                },
                started_at=datetime.datetime.utcnow(),
                completed_at=datetime.datetime.utcnow()
            )
            db.add(job)
            db.commit()

            print(f"[+] Seeded Demo Project: {proj.name} ({proj.disease_type})")

    db.close()
    print("[+] Seeding complete! Login credentials: researcher@neurogen.ai / password123")

if __name__ == "__main__":
    seed()
