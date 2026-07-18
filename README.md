# NeuroGen AI 🧬 - Multi-Omic & Brain Tumor AI Research Platform

[![CI/CD Pipeline](https://github.com/nagarjuna-32/braincancer-bio/actions/workflows/ci.yml/badge.svg)](https://github.com/nagarjuna-32/braincancer-bio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](docker/docker-compose.yml)

**NeuroGen AI** is an end-to-end, disease-agnostic bioinformatics and clinical artificial intelligence platform designed for neuro-oncology, cancer genomics, and multi-disease research.

It integrates multi-format dataset ingestion, RNA-Seq differential expression analysis, deep residual learning MRI classification (ResNet-18) & segmentation (U-Net), 8-tier knowledge graph generation, evidence-backed RAG AI copilot querying across 11 live public biomedical resources, and automated PDF clinical report generation.

---

## 🌟 Key Features

- **🌐 11 Live Public Biomedical APIs:** Direct caching and live queries to NCBI Entrez, GEO, TCGA/GDC, PubMed, Ensembl, UniProt, KEGG, Reactome, Gene Ontology, ClinVar, and COSMIC.
- **🔬 End-to-End Bioinformatics Engine:** Ingests CSV, FASTA, FASTQ, VCF, BAM, DICOM, and NIfTI (`.nii`/`.nii.gz`). Performs CPM normalization, Log2FoldChange DEG, Volcano plots, and Hypergeometric GSEA pathway enrichment.
- **🤖 Deep Learning & ML Models:** PyTorch ResNet-18 for 4-class MRI tumor classification, U-Net for tumor segmentation, and LASSO/RandomForest for 3-year survival prognosis.
- **🕸 8-Tier Knowledge Graph:** Directional multi-entity relationship mapping (`Disease ➔ Genes ➔ Variants ➔ Proteins ➔ Pathways ➔ Biomarkers ➔ Publications ➔ Clinical Trials`).
- **🧠 Evidence-Backed RAG AI:** Semantic vector search providing scientific explanations backed by PMIDs, KEGG/Reactome IDs, ClinVar variants, confidence metrics, and clinical limitations.
- **🏥 Pan-Cancer & Disease Agnostic:** Out-of-the-box support for Brain Cancer (GBM), Lung Cancer (NSCLC), Breast Cancer (BRCA), Colon Cancer (COAD), Leukemia (AML), Alzheimer's Disease, and Parkinson's Disease.

---

## 🏗 System Architecture

```text
                                  ┌──────────────────────────┐
                                  │   Next.js 16 App UI      │
                                  └────────────┬─────────────┘
                                               │ REST API
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
```

---

## 🚀 Quick Start

### Option A: Local Development Server
```bash
# 1. Clone repository
git clone https://github.com/nagarjuna-32/braincancer-bio.git
cd braincancer-bio

# 2. Run backend microservices
python scripts/run_services.py

# 3. In another terminal, run Next.js frontend
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.  
**Pre-loaded Demo Login:** `researcher@neurogen.ai` / `password123`

### Option B: Docker Compose
```bash
docker-compose -f docker/docker-compose.yml up -d --build
```

---

## 🧪 Testing

Run the automated test suite:
```bash
python -m pytest tests/ -v
```

---

## 📄 License & Documentation

- **Software Architecture:** [docs/software_architecture_specification.md](docs/software_architecture_specification.md)
- **Bioinformatics Engine:** [docs/bioinformatics_engine_specification.md](docs/bioinformatics_engine_specification.md)
- **Machine Learning Specification:** [docs/machine_learning_specification.md](docs/machine_learning_specification.md)
- **Model Validation Cards:** [docs/ml_model_validation_cards.md](docs/ml_model_validation_cards.md)
- **License:** [MIT License](LICENSE)
