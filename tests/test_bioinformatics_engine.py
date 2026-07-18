"""
Bioinformatics Pipeline Unit & Integration Tests
"""

import pytest
import numpy as np
import pandas as pd
from bioinformatics.engine import RNASeqPipelineEngine

def test_rnaseq_pipeline():
    # Mock counts matrix
    df_raw = pd.DataFrame({
        "gene_symbol": ["EGFR", "IDH1", "TP53", "PTEN", "MGMT"],
        "ctrl_1": [100, 500, 200, 150, 80],
        "ctrl_2": [110, 520, 210, 140, 85],
        "tumor_1": [1200, 150, 40, 20, 10],
        "tumor_2": [1300, 160, 45, 25, 12]
    })
    
    engine = RNASeqPipelineEngine(df_raw)
    
    # 1. Test QC
    qc_res = engine.run_quality_control()
    assert qc_res["total_genes"] == 5
    assert qc_res["total_samples"] == 4
    assert qc_res["status"] in ["PASS", "WARN"]

    # 2. Test CPM Normalization
    cpm_df = engine.normalize_cpm()
    assert "EGFR" in cpm_df["gene_symbol"].values
    assert cpm_df["tumor_1"].iloc[0] > cpm_df["ctrl_1"].iloc[0]

    # 3. Test DEG calculation
    deg_df = engine.calculate_deg(group_control=["ctrl_1", "ctrl_2"], group_tumor=["tumor_1", "tumor_2"])
    assert "log2FoldChange" in deg_df.columns
    assert float(deg_df[deg_df["gene_symbol"] == "EGFR"]["log2FoldChange"].iloc[0]) > 2.0

    # 4. Test Volcano data generation
    volcano = engine.generate_volcano_data(deg_df)
    assert len(volcano) == 5
    up_genes = [p["gene"] for p in volcano if p["significance"] == "UP"]
    assert "EGFR" in up_genes

    # 5. Test Top Genes extraction
    top_genes = engine.extract_top_genes(deg_df, top_n=2)
    assert len(top_genes) == 2
