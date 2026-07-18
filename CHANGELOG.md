# Changelog

All notable changes to **NeuroGen AI** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-07-18

### Added
- **11 Live Biomedical API Integration:** Direct API connections with TTL caching to NCBI Entrez, GEO, TCGA/GDC, PubMed, Ensembl, UniProt, KEGG, Reactome, Gene Ontology, ClinVar, and COSMIC.
- **Sprint 4 Knowledge Graph Engine:** 8-tier directional graph generation (`Disease ➔ Genes ➔ Variants ➔ Proteins ➔ Pathways ➔ Biomarkers ➔ Publications ➔ Clinical Trials`).
- **Sprint 5 Evidence-Backed AI Copilot:** RAG vector search returning scientific explanations with PMIDs, KEGG/Reactome IDs, ClinVar variants, confidence metrics, and limitations.
- **Pan-Cancer Support:** Database schema & UI expanded to support Brain Cancer (GBM), Lung Cancer (NSCLC), Breast Cancer (BRCA), Colon Cancer (COAD), Leukemia (AML), Alzheimer's Disease, and Parkinson's Disease.
- **Pre-Loaded Demo Workspace:** Pre-configured glioblastoma, lung cancer, and Alzheimer's research projects (`researcher@neurogen.ai` / `password123`).
- **Bioinformatics Engine:** RNA-seq CPM normalization, Log2FC DEG analysis, Volcano plots, Hypergeometric GSEA, and Kaplan-Meier survival curves.
- **ML Model Registry & ONNX Export:** PyTorch ResNet-18 classifier, U-Net segmenter, and ONNX runtime export pipeline.
- **Infrastructure & CI/CD:** Docker Compose, Render Blueprint (`render.yaml`), Kubernetes Helm Charts (`infrastructure/helm/`), Terraform IaC, and GitHub Actions workflow (`.github/workflows/ci.yml`).
- **Documentation:** `software_architecture_specification.md`, `bioinformatics_engine_specification.md`, `machine_learning_specification.md`, and `ml_model_validation_cards.md`.
