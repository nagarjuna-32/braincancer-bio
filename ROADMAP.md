# NeuroGen AI - Product & Scientific Roadmap 🚀

This document outlines the strategic milestones and future release goals for **NeuroGen AI**.

---

## 📅 Roadmap Overview

```text
[v1.0 - Current]  ──► [v1.5 - Q3 2026] ──► [v2.0 - Q4 2026] ──► [v3.0 - 2027]
Multi-Omic Core       Multi-Disease       FedML & Single-Cell   Clinical Trial
& 11 Bio APIs         Graph Expansion     scRNA Pipeline        FDA Portal
```

---

## 🎯 Milestone Breakdown

### Phase 1 — Core Foundation & Public Data (v1.0 - Completed ✅)
- [x] 11 Live Biomedical API integrations (NCBI, GEO, TCGA, PubMed, Ensembl, UniProt, KEGG, Reactome, GO, ClinVar, COSMIC).
- [x] 23-table relational database schema with PostgreSQL/SQLite support.
- [x] PyTorch ResNet-18 MRI classifier, U-Net segmenter, and ONNX export pipeline.
- [x] RNA-Seq CPM normalization, Log2FC DEG, Volcano plots, GSEA, and Kaplan-Meier curves.
- [x] 8-Tier Knowledge Graph Engine & Evidence-backed RAG AI Copilot.
- [x] Multi-cloud deployment specs (Vercel + Render + Supabase + Kubernetes Helm).

### Phase 2 — Multi-Disease Expansion (v1.5 - Target Q3 2026)
- [ ] Pre-trained vision transformer (ViT) models for histopathology WSI (Whole Slide Image) classification.
- [ ] Pan-cancer comparative cross-cohort differential gene expression explorer.
- [ ] Interactive 3D volume rendering for DICOM/NIfTI brain MRI scans directly in Next.js UI.

### Phase 3 — Single-Cell & Federated Learning (v2.0 - Target Q4 2026)
- [ ] Single-cell RNA-seq (scRNA-Seq) Seurat / Scanpy pipeline integration (UMAP / t-SNE clustering).
- [ ] Privacy-preserving Federated Machine Learning for multi-hospital collaborative model training without data centralized sharing.

### Phase 4 — Enterprise Clinical Decision Support (v3.0 - Target 2027)
- [ ] Epic Systems / Cerner EHR HL7 FHIR interoperability integration.
- [ ] Automated FDA SaMD (Software as a Medical Device) audit trail logging.
