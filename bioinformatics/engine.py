"""
NeuroGen AI - Core Bioinformatics Pipeline Engine
=================================================
Phase 6 Engine: Implements end-to-end RNA-Seq Pipeline:
  Upload -> Quality Control (QC) -> Normalization (CPM/TPM) -> Differential Expression (DEG) -> Volcano Plot -> Gene List
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List

class RNASeqPipelineEngine:
    def __init__(self, raw_counts_df: pd.DataFrame):
        self.raw_counts = raw_counts_df

    def run_quality_control(self) -> Dict[str, Any]:
        """Phase 6 QC: Calculate total reads, zero-count genes, and library sizes."""
        total_genes = len(self.raw_counts)
        sample_cols = [c for c in self.raw_counts.columns if c != "gene_symbol"]
        lib_sizes = self.raw_counts[sample_cols].sum(axis=0).to_dict()
        zero_genes = int((self.raw_counts[sample_cols].sum(axis=1) == 0).sum())
        return {
            "total_genes": total_genes,
            "total_samples": len(sample_cols),
            "library_sizes": lib_sizes,
            "unexpressed_genes": zero_genes,
            "status": "PASS" if zero_genes / max(total_genes, 1) < 0.5 else "WARN"
        }

    def normalize_cpm(self) -> pd.DataFrame:
        """Phase 6 Normalization: Counts Per Million (CPM)."""
        sample_cols = [c for c in self.raw_counts.columns if c != "gene_symbol"]
        counts = self.raw_counts[sample_cols].values
        lib_sums = counts.sum(axis=0)
        cpm = (counts / lib_sums) * 1e6
        df_cpm = pd.DataFrame(cpm, columns=sample_cols)
        if "gene_symbol" in self.raw_counts.columns:
            df_cpm.insert(0, "gene_symbol", self.raw_counts["gene_symbol"])
        return df_cpm

    def calculate_deg(self, group_control: List[str], group_tumor: List[str]) -> pd.DataFrame:
        """Phase 6 Differential Expression Analysis (Log2FoldChange & p-values)."""
        cpm_df = self.normalize_cpm()
        control_means = cpm_df[group_control].mean(axis=1)
        tumor_means = cpm_df[group_tumor].mean(axis=1)
        
        log2fc = np.log2((tumor_means + 1.0) / (control_means + 1.0))
        # Simulated p-values based on fold change magnitude
        p_values = np.exp(-np.abs(log2fc) * 2.5) + 1e-6
        p_values = np.clip(p_values, 1e-12, 1.0)

        deg_results = pd.DataFrame({
            "gene_symbol": cpm_df["gene_symbol"] if "gene_symbol" in cpm_df.columns else [f"GENE_{i}" for i in range(len(cpm_df))],
            "control_mean": control_means,
            "tumor_mean": tumor_means,
            "log2FoldChange": log2fc,
            "p_value": p_values,
            "neg_log10_p": -np.log10(p_values)
        })
        return deg_results

    def generate_volcano_data(self, deg_df: pd.DataFrame, fc_threshold: float = 1.0, p_threshold: float = 0.05) -> List[Dict[str, Any]]:
        """Phase 6 Volcano Plot Data Generator."""
        points = []
        for _, row in deg_df.iterrows():
            lfc = float(row["log2FoldChange"])
            pval = float(row["p_value"])
            neg_log_p = float(row["neg_log10_p"])
            
            if lfc >= fc_threshold and pval <= p_threshold:
                significance = "UP"
            elif lfc <= -fc_threshold and pval <= p_threshold:
                significance = "DOWN"
            else:
                significance = "NS"

            points.append({
                "gene": str(row["gene_symbol"]),
                "x": round(lfc, 4),
                "y": round(neg_log_p, 4),
                "significance": significance
            })
        return points

    def extract_top_genes(self, deg_df: pd.DataFrame, top_n: int = 50) -> List[str]:
        """Phase 6 Gene List Output."""
        sorted_df = deg_df.sort_values(by="p_value")
        return sorted_df["gene_symbol"].head(top_n).tolist()
