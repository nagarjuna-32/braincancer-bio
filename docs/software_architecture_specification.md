# NeuroGen AI - Software Architecture Specification (SAS)

**Document Version:** 1.0.0  
**Status:** Approved Technical Architecture  

---

## 1. System Architecture Overview

NeuroGen AI is built as a microservices-based, event-driven platform designed for clinical neuro-oncology research, multi-omic analysis, and brain tumor MRI diagnosis.

```text
                                  ┌──────────────────────────┐
                                  │   Next.js 16 App UI      │
                                  └────────────┬─────────────┘
                                               │ HTTP / REST
                                               ▼
                                  ┌──────────────────────────┐
                                  │   API Gateway (Port 8000)│
                                  └────────────┬─────────────┘
                                               │
  ┌───────────┬────────────┬───────────┼───────────┬───────────┬────────────┐
  ▼           ▼            ▼           ▼           ▼           ▼            ▼
Auth       Projects    Datasets    Analysis       AI     Bioinformatics  External APIs
(8001)      (8002)      (8003)      (8004)      (8005)       (8006)        (8009)
  │           │            │           │           │           │            │
  └───────────┴────────────┴───────────┼───────────┴───────────┴────────────┘
                                       │
                        ┌──────────────┴──────────────┐
                        ▼                             ▼
                PostgreSQL (5432)             Redis (6379)
                Global Relational DB          Cache & Celery Broker
```

---

## 2. Microservices Registry & Ports

| Service | Port | Responsibilities |
|---------|------|------------------|
| **API Gateway** | 8000 | Request routing, CORS, payload forwarding, rate limiting |
| **Auth Service** | 8001 | JWT issuance, registration, login, email verification, RBAC |
| **Project Service** | 8002 | Project workspaces, collaborator memberships |
| **Dataset Service** | 8003 | Multi-format file uploads (FASTA, FASTQ, CSV, VCF, BAM, DICOM, NIfTI), chunking |
| **Analysis Service** | 8004 | Orchestration of RNA-Seq, Somatic Calling, MRI inference jobs |
| **AI Service** | 8005 | RAG copilot, literature query, report summary generation |
| **Bioinformatics Service** | 8006 | Execution of bioinformatics pipelines |
| **Reports Service** | 8007 | PDF / Excel clinical report exporting |
| **Notification Service** | 8008 | User alerts, analysis completion notifications |
| **External APIs Service** | 8009 | Live integration with 10 biomedical APIs + TTL caching |

---

## 3. Database Schema (23 Relational Tables)

The platform persistence layer is backed by PostgreSQL (and SQLite in local dev mode):

```text
users                 organizations          projects              members
datasets              dataset_files          analysis_jobs         analyses
reports               genes                  mutations / variants  proteins
pathways              papers                 clinical_trials       models
model_versions        workflows              experiments           notes
notifications         audit_logs             chat_sessions         chat_messages
```

---

## 4. Deployment Strategy

1. **Docker Compose:** Single-command local/VPS deployment via `docker/docker-compose.yml`.
2. **Multi-Cloud Hybrid:**
   - **Frontend:** Deployed to Vercel connected to GitHub repository.
   - **Backend:** Deployed to Render via `render.yaml`.
   - **Database:** Hosted on Supabase (PostgreSQL 15).
3. **Kubernetes (Production):** Cluster deployments configured in `kubernetes/deployment.yaml` and `kubernetes/ingress.yaml`.
