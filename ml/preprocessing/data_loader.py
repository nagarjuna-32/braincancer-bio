"""
NeuroGen AI ML Preprocessing & DataLoader Module
Provides functions for loading, cleaning, normalizing, and partitioning multi-omics data.
"""
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any

def normalize_tpm(counts: np.ndarray, gene_lengths: np.ndarray) -> np.ndarray:
    """
    Normalize raw sequencing counts to Transcripts Per Million (TPM).
    Formula: TPM_i = (Reads_i / Length_i) / sum(Reads_j / Length_j) * 1e6
    """
    # Avoid division by zero
    lengths_kb = np.maximum(gene_lengths, 1) / 1000.0
    rpk = counts / lengths_kb[:, np.newaxis]
    sum_rpk = np.sum(rpk, axis=0)
    tpm = (rpk / np.maximum(sum_rpk, 1e-8)) * 1e6
    return tpm

def log2_transform(data: np.ndarray, offset: float = 1.0) -> np.ndarray:
    """
    Log2 transform data (typically TPM or FPKM) with a pseudo-count offset.
    """
    return np.log2(np.maximum(data, 0.0) + offset)

def filter_low_variance(data: pd.DataFrame, percentile: float = 0.5) -> pd.DataFrame:
    """
    Filter out genes with low variance across samples to reduce feature dimensionality.
    """
    variances = data.var(axis=1)
    threshold = np.percentile(variances, percentile * 100)
    return data.loc[variances >= threshold]

def load_simulated_clinical_cohort(num_samples: int = 100) -> pd.DataFrame:
    """
    Generates a high-quality simulated clinical dataset containing demographics,
    survival indicators, mutation signatures, and response labels.
    """
    np.random.seed(42)
    ages = np.random.randint(25, 80, size=num_samples)
    genders = np.random.choice(["Male", "Female"], size=num_samples)
    
    # Generate overall survival times (in days) using an exponential hazard model
    base_hazard = 0.0005
    # Risk factor: older age and IDH1-wildtype increases hazard
    idh1_mut = np.random.choice([0, 1], p=[0.7, 0.3], size=num_samples)
    risk_score = 0.02 * (ages - 50) - 1.2 * idh1_mut
    hazard = base_hazard * np.exp(risk_score)
    survival_days = np.random.exponential(1.0 / hazard).astype(int)
    
    # Censor status: 1 = deceased, 0 = censored
    observed = (survival_days < 2500).astype(int)
    survival_days = np.clip(survival_days, 30, 2500)
    
    # Subtypes: Classical, Mesenchymal, Proneural
    subtypes = []
    for idh in idh1_mut:
        if idh == 1:
            subtypes.append("Proneural")
        else:
            subtypes.append(np.random.choice(["Classical", "Mesenchymal"], p=[0.6, 0.4]))
            
    df = pd.DataFrame({
        "Patient_ID": [f"SUBJ_{i:04d}" for i in range(num_samples)],
        "Age": ages,
        "Gender": genders,
        "IDH1_Mutation": idh1_mut,
        "Survival_Days": survival_days,
        "Status": observed,
        "Subtype": subtypes
    })
    return df
