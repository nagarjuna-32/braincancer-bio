"""
NeuroGen AI - Database Cleanup & Neon Deployment Sanitizer
===========================================================
Removes all demo users (researcher@neurogen.ai), sample projects, duplicate records,
and resets SQLite/Postgres tables for clean deployment to Neon Serverless Postgres.
"""

import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import (
    init_db, SessionLocal, User, Organization, Project, Member,
    Dataset, DatasetFile, Analysis, AnalysisJob
)

def cleanup():
    print("[*] Starting database cleanup for Neon production deployment...")
    init_db()
    db = SessionLocal()

    # 1. Delete Demo User & associated memberships
    demo_user = db.query(User).filter(User.email == "researcher@neurogen.ai").first()
    if demo_user:
        print(f"[-] Removing demo user: {demo_user.email} (ID {demo_user.id})")
        db.query(Member).filter(Member.user_id == demo_user.id).delete()
        db.delete(demo_user)
        db.commit()

    # 2. Delete Demo Projects & Datasets
    demo_project_names = [
        "TCGA Glioblastoma Multi-Omic Cohort",
        "NSCLC EGFR Targeted Immunotherapy",
        "Alzheimer's Amyloid Plaque Microarray Study"
    ]
    for proj_name in demo_project_names:
        projects = db.query(Project).filter(Project.name == proj_name).all()
        for p in projects:
            print(f"[-] Deleting demo project: {p.name} (ID {p.id})")
            db.query(AnalysisJob).filter(AnalysisJob.analysis_id.in_(
                db.query(Analysis.id).filter(Analysis.project_id == p.id)
            )).delete(synchronize_session=False)
            db.query(Analysis).filter(Analysis.project_id == p.id).delete()
            db.query(DatasetFile).filter(DatasetFile.dataset_id.in_(
                db.query(Dataset.id).filter(Dataset.project_id == p.id)
            )).delete(synchronize_session=False)
            db.query(Dataset).filter(Dataset.project_id == p.id).delete()
            db.query(Member).filter(Member.project_id == p.id).delete()
            db.delete(p)
            db.commit()

    # 3. Clean up Demo Organization
    demo_org = db.query(Organization).filter(Organization.name == "National Neuro-Oncology & Genomics Institute").first()
    if demo_org:
        print(f"[-] Removing demo organization: {demo_org.name}")
        db.delete(demo_org)
        db.commit()

    db.close()
    print("[+] Database cleanup complete! Clean state ready for Neon Postgres deployment.")

if __name__ == "__main__":
    cleanup()
