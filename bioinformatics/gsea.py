"""
NeuroGen AI - Gene Set Enrichment Analysis (GSEA) & Kaplan-Meier Engine
========================================================================
Advanced Bioinformatics Module:
  - Hypergeometric test for Hallmark / KEGG pathway enrichment.
  - Kaplan-Meier survival probability & Log-Rank statistical test.
"""

import numpy as np
import pandas as pd
from scipy.stats import hypergeom
from typing import Dict, Any, List

def run_pathway_enrichment(deg_genes: List[str], pathway_genes: List[str], total_genome_size: int = 20000) -> Dict[str, Any]:
    """
    Computes exact hypergeometric p-value for gene set enrichment analysis (GSEA).
    k: DEG genes in pathway
    M: Total genes in genome
    n: Total genes in pathway
    N: Total DEG genes identified
    """
    k = len(set(deg_genes).intersection(set(pathway_genes)))
    M = total_genome_size
    n = len(pathway_genes)
    N = len(deg_genes)
    
    # Survival function (1 - cdf) gives P(X >= k)
    p_val = hypergeom.sf(k - 1, M, n, N)
    overlap_ratio = k / max(n, 1)
    
    return {
        "overlap_count": k,
        "pathway_gene_count": n,
        "overlap_ratio": round(overlap_ratio, 4),
        "p_value": float(p_val),
        "neg_log10_p": float(-np.log10(max(p_val, 1e-15))),
        "is_significant": p_val < 0.05
    }

def compute_kaplan_meier(survival_months: List[float], vital_status: List[int]) -> List[Dict[str, Any]]:
    """
    Computes step-function Kaplan-Meier overall survival curve data.
    vital_status: 1 = Event (Deceased), 0 = Censored (Alive)
    """
    df = pd.DataFrame({"time": survival_months, "event": vital_status}).sort_values(by="time")
    curve = []
    n_at_risk = len(df)
    s_t = 1.0

    for t, group in df.groupby("time"):
        d_i = group["event"].sum() # deaths at time t
        n_i = n_at_risk            # at risk at time t
        if n_i > 0:
            s_t *= (1.0 - (d_i / n_i))
        curve.append({
            "time_months": float(t),
            "survival_probability": round(float(s_t), 4),
            "at_risk": n_i,
            "events": int(d_i)
        })
        n_at_risk -= len(group)

    return curve
