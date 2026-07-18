"""
NeuroGen AI - Datasets Registry
===============================
Manages public datasets (TCGA-GBM, GEO, Brain Tumor MRI Dataset) available in local cache.
"""

PUBLIC_DATASETS = [
    {
        "id": "TCGA-GBM-RNASeq",
        "name": "TCGA Glioblastoma RNA-seq Cohort",
        "type": "Transcriptomic",
        "samples": 160,
        "format": "CSV",
        "file_path": "backend/data/expression_matrix.csv"
    },
    {
        "id": "TCGA-GBM-VCF",
        "name": "TCGA Glioblastoma Somatic Mutations",
        "type": "Genomic",
        "samples": 10,
        "format": "VCF",
        "file_path": "backend/data/variants_run_01.vcf"
    },
    {
        "id": "MRI-BRAIN-TCIA",
        "name": "TCIA Brain Tumor MRI Series",
        "type": "Imaging",
        "samples": 8,
        "format": "DICOM",
        "file_path": "backend/data/brain_mri_series_01.dcm"
    }
]

def list_public_datasets():
    return PUBLIC_DATASETS
