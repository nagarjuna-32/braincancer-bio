"""
NeuroGen AI - Gene Expression (Transcriptomics) Analysis & ML Pipeline
======================================================================
This script contains a complete, self-contained Python pipeline for:
1. Differential Gene Expression Analysis (t-test / fold-change, Volcano Plots)
2. Subtype Classification (Machine Learning RandomForest on transcriptomic profiles)
3. Kaplan-Meier Survival Analysis (Cohort stratification based on expression profiles)
4. Pathway Over-Representation Analysis (Enrichment scoring against signaling pathways)

Includes a synthetic transcriptomic dataset generator for immediate execution.
"""

import os
import sys
import time
import random
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats

# Verify required packages are present
def verify_packages():
    required = {
        "pandas": "pandas",
        "numpy": "numpy",
        "scipy": "scipy",
        "sklearn": "scikit-learn",
        "matplotlib": "matplotlib",
        "lifelines": "lifelines"
    }
    missing = []
    for module, pkg in required.items():
        try:
            __import__(module)
        except ImportError:
            missing.append(pkg)
            
    if missing:
        print("[-] Missing required libraries for expression pipeline: " + ", ".join(missing))
        print("[*] Installing dependencies automatically...")
        try:
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing)
            print("[+] Dependencies installed successfully!\n")
        except Exception as e:
            print(f"[-] Failed to auto-install dependencies: {e}. Please install them manually.")
            sys.exit(1)

verify_packages()

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from lifelines import KaplanMeierFitter
from lifelines.statistics import logrank_test

# Set random seeds for reproducibility
np.random.seed(42)
random.seed(42)


# =====================================================================
# PART 1: Synthetic Transcriptomics & Clinical Dataset Generator
# =====================================================================
def generate_synthetic_expression_dataset(num_samples=180, num_genes=400):
    """
    Generates a mock normalized gene expression matrix (FPKM/TPM) and matching
    clinical profiles for lower-grade glioma (LGG) and glioblastoma (GBM) cohorts.
    """
    print("[+] Synthesizing transcriptomic expression matrix...")
    
    # Selected clinical brain cancer marker genes
    key_genes = [
        "EGFR", "PTEN", "TP53", "IDH1", "MGMT", "ATRX", "CDKN2A", "CDK4", "MDM2", "PDCD1", 
        "OLIG2", "CHI3L1", "MET", "NF1", "BRAF", "MGMT_methylated"
    ]
    
    # Make up the rest with generic gene symbols (e.g. GENE_001)
    generic_genes = [f"GENE_{i:03d}" for i in range(num_genes - len(key_genes))]
    all_genes = key_genes + generic_genes
    
    # Subtype definitions: Classical, Mesenchymal, Proneural
    subtypes = ["Classical", "Mesenchymal", "Proneural"]
    sample_subtypes = [subtypes[i % 3] for i in range(num_samples)]
    
    # Generate log-normal baseline expressions
    expression_data = np.random.normal(5.0, 1.2, (num_samples, num_genes))
    df_expr = pd.DataFrame(expression_data, columns=all_genes)
    
    # Inject specific molecular subtype signatures
    for idx, subtype in enumerate(sample_subtypes):
        if subtype == "Classical":
            # High EGFR, low CDKN2A (tumor suppressor loss)
            df_expr.loc[idx, "EGFR"] += np.random.normal(3.5, 0.5)
            df_expr.loc[idx, "CDKN2A"] -= np.random.normal(2.5, 0.4)
            df_expr.loc[idx, "CDK4"] += np.random.normal(2.0, 0.3)
        elif subtype == "Mesenchymal":
            # High CHI3L1 (YKL-40), high MET, low NF1
            df_expr.loc[idx, "CHI3L1"] += np.random.normal(4.0, 0.6)
            df_expr.loc[idx, "MET"] += np.random.normal(3.0, 0.5)
            df_expr.loc[idx, "NF1"] -= np.random.normal(2.0, 0.4)
        elif subtype == "Proneural":
            # High IDH1 mutation profile, high OLIG2, high ATRX
            df_expr.loc[idx, "IDH1"] += np.random.normal(3.0, 0.4)
            df_expr.loc[idx, "OLIG2"] += np.random.normal(3.5, 0.5)
            df_expr.loc[idx, "ATRX"] += np.random.normal(2.0, 0.3)
            
    # Clip expressions to represent non-negative log-counts
    df_expr = df_expr.clip(lower=0.0)
    
    # Generate associated clinical outcomes
    print("[+] Synthesizing clinical outcome registries...")
    clinical_records = []
    for idx, subtype in enumerate(sample_subtypes):
        patient_id = f"PATIENT_{idx:03d}"
        age = random.randint(30, 75)
        sex = "Male" if random.random() > 0.45 else "Female"
        
        # Determine survival based on subtype (Proneural has IDH1 mutant, best survival)
        if subtype == "Proneural":
            # Better prognosis
            survival_days = int(np.random.normal(1200, 200))
            idh_status = "Mutant"
        elif subtype == "Classical":
            survival_days = int(np.random.normal(450, 100))
            idh_status = "Wildtype"
        else: # Mesenchymal
            # Aggressive, poor prognosis
            survival_days = int(np.random.normal(350, 80))
            idh_status = "Wildtype"
            
        survival_days = max(100, survival_days)
        # 1: Deceased, 0: Censored (still alive at study end)
        vital_status = 1 if random.random() > 0.2 else 0
        
        clinical_records.append({
            "patient_id": patient_id,
            "age": age,
            "sex": sex,
            "subtype": subtype,
            "idh_status": idh_status,
            "survival_days": survival_days,
            "vital_status": vital_status
        })
        
    df_clinical = pd.DataFrame(clinical_records)
    return df_expr, df_clinical


# =====================================================================
# PART 2: Differential Expression Analysis (Volcano Mapping)
# =====================================================================
def run_differential_expression(df_expr, df_clinical):
    """
    Compares gene expression between IDH-mutant vs IDH-wildtype cohorts.
    Calculates log2 fold change and adjusted p-values.
    """
    print("\n[STEP 1] Running Differential Expression Analysis (IDH-mutant vs Wildtype)...")
    
    mut_indices = df_clinical[df_clinical["idh_status"] == "Mutant"].index
    wt_indices = df_clinical[df_clinical["idh_status"] == "Wildtype"].index
    
    results = []
    for gene in df_expr.columns:
        expr_mut = df_expr.loc[mut_indices, gene].values
        expr_wt = df_expr.loc[wt_indices, gene].values
        
        # Mean expressions
        mean_mut = np.mean(expr_mut)
        mean_wt = np.mean(expr_wt)
        
        # Log2 fold change
        # Add small offset to prevent division-by-zero
        log2fc = np.log2((mean_mut + 0.1) / (mean_wt + 0.1))
        
        # Student's t-test
        t_stat, p_val = stats.ttest_ind(expr_mut, expr_wt, equal_var=False)
        
        results.append({
            "gene": gene,
            "log2FC": log2fc,
            "p_value": p_val if not np.isnan(p_val) else 1.0
        })
        
    df_de = pd.DataFrame(results)
    
    # Benjamini-Hochberg False Discovery Rate (FDR) correction
    df_de = df_de.sort_values("p_value")
    n_genes = len(df_de)
    df_de["rank"] = np.arange(1, n_genes + 1)
    df_de["q_value"] = df_de["p_value"] * n_genes / df_de["rank"]
    df_de["q_value"] = np.minimum(df_de["q_value"], 1.0)
    
    # Filter significant genes (|log2FC| > 1.5, q_value < 0.05)
    sig_up = df_de[(df_de["log2FC"] > 1.5) & (df_de["q_value"] < 0.05)]
    sig_down = df_de[(df_de["log2FC"] < -1.5) & (df_de["q_value"] < 0.05)]
    
    print(f"    * Analysis Complete: Identifed {len(sig_up)} up-regulated and {len(sig_down)} down-regulated genes.")
    return df_de


# =====================================================================
# PART 3: Subtype Classification (Random Forest ML)
# =====================================================================
def train_subtype_classifier(df_expr, df_clinical):
    """
    Trains a Random Forest classifier to predict glioblastoma subtypes
    (Classical, Mesenchymal, Proneural) using gene expression patterns.
    """
    print("\n[STEP 2] Training Transcriptomic Subtype Classifier...")
    
    X = df_expr.values
    y = df_clinical["subtype"].values
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    
    clf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"    * Random Forest Accuracy: {accuracy * 100:.2f}%")
    print("\n[+] Classifier Classification Report:")
    print(classification_report(y_test, y_pred))
    
    # Extract top 5 driver genes
    importances = clf.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    print("    * Top 5 Driver Genomical Biomarkers:")
    for i in range(5):
        print(f"      - {df_expr.columns[indices[i]]}: {importances[indices[i]]*100:.2f}% importance score")
        
    return clf


# =====================================================================
# PART 4: Kaplan-Meier Survival Analysis
# =====================================================================
def run_survival_analysis(df_expr, df_clinical):
    """
    Stratifies patients into EGFR-high vs EGFR-low cohorts
    and fits Kaplan-Meier survival curves.
    """
    print("\n[STEP 3] Running Kaplan-Meier Survival Stratification...")
    
    # Stratify patients by EGFR median expression
    egfr_median = df_expr["EGFR"].median()
    high_egfr_indices = df_expr[df_expr["EGFR"] >= egfr_median].index
    low_egfr_indices = df_expr[df_expr["EGFR"] < egfr_median].index
    
    df_high = df_clinical.loc[high_egfr_indices]
    df_low = df_clinical.loc[low_egfr_indices]
    
    # Fit KM Curves
    kmf_high = KaplanMeierFitter()
    kmf_low = KaplanMeierFitter()
    
    kmf_high.fit(df_high["survival_days"], event_observed=df_high["vital_status"], label="EGFR High Expression")
    kmf_low.fit(df_low["survival_days"], event_observed=df_low["vital_status"], label="EGFR Low Expression")
    
    # Log-Rank Test to compare curves
    results = logrank_test(
        df_high["survival_days"], df_low["survival_days"],
        event_observed_A=df_high["vital_status"], event_observed_B=df_low["vital_status"]
    )
    
    print(f"    * Log-Rank test p-value: {results.p_value:.6f}")
    return kmf_high, kmf_low, results.p_value


# =====================================================================
# PART 5: Pathway Over-Representation Analysis
# =====================================================================
def run_pathway_enrichment(df_de):
    """
    Compares up-regulated genes against mock signaling pathways (ORA).
    """
    print("\n[STEP 4] Running Pathway Over-Representation Analysis (ORA)...")
    
    # Extract significant up-regulated genes
    sig_genes = set(df_de[(df_de["log2FC"] > 1.2) & (df_de["p_value"] < 0.05)]["gene"])
    
    # Define pathways reference database
    pathways = {
        "PI3K_AKT_mTOR_Pathway": ["EGFR", "PIK3CA", "AKT1", "MTOR", "PTEN", "PDCD1", "GENE_001", "GENE_002", "GENE_003"],
        "Cell_Cycle_Checkpoint": ["TP53", "CDKN2A", "CDK4", "MDM2", "GENE_004", "GENE_005", "GENE_006"],
        "MGMT_DNA_Repair": ["MGMT", "MGMT_methylated", "ATRX", "GENE_007", "GENE_008"]
    }
    
    n_background = 400  # Total genes
    n_drawn = len(sig_genes)
    
    print(f"    * Mapping {n_drawn} up-regulated genes to reference pathways:")
    for path_name, path_genes in pathways.items():
        intersection = sig_genes.intersection(path_genes)
        k_intersect = len(intersection)
        m_path_size = len(path_genes)
        
        # Hypergeometric test probability using stats.hypergeom
        # M: total background, n: total in pathway, N: sample drawn, k: observed overlapping
        p_val = stats.hypergeom.sf(k_intersect - 1, n_background, m_path_size, n_drawn)
        
        print(f"      - {path_name:25} | Overlap: {k_intersect}/{m_path_size} | Enrich p-value: {p_val:.6f}")


# =====================================================================
# PART 6: Visualizations & Saving
# =====================================================================
def plot_results(df_de, kmf_high, kmf_low, p_val):
    print("\n[STEP 5] Generating Plots and Analytics Charts...")
    
    plt.figure(figsize=(14, 5))
    
    # 1. Volcano Plot
    plt.subplot(1, 2, 1)
    # Define colors
    colors = []
    for _, row in df_de.iterrows():
        if row["log2FC"] > 1.5 and row["q_value"] < 0.05:
            colors.append("red")
        elif row["log2FC"] < -1.5 and row["q_value"] < 0.05:
            colors.append("blue")
        else:
            colors.append("gray")
            
    minus_log10p = -np.log10(df_de["p_value"])
    plt.scatter(df_de["log2FC"], minus_log10p, c=colors, alpha=0.6, edgecolors="none", s=20)
    plt.axvline(x=1.5, color="red", linestyle="--", alpha=0.5)
    plt.axvline(x=-1.5, color="blue", linestyle="--", alpha=0.5)
    plt.axhline(y=-np.log10(0.05), color="black", linestyle=":", alpha=0.5)
    
    # Label key genes
    label_genes = ["EGFR", "PTEN", "TP53", "IDH1", "MGMT"]
    for gene in label_genes:
        row = df_de[df_de["gene"] == gene]
        if not row.empty:
            plt.annotate(gene, (row["log2FC"].values[0], -np.log10(row["p_value"].values[0])), textcoords="offset points", xytext=(0,5), ha='center', weight='bold', color='black')
            
    plt.title("Genomical Volcano Plot (IDH-mut vs WT)")
    plt.xlabel("log2 Fold Change")
    plt.ylabel("-log10 p-value")
    
    # 2. Kaplan-Meier Curves
    plt.subplot(1, 2, 2)
    kmf_high.plot_survival_function(color="darkred", ci_show=False)
    kmf_low.plot_survival_function(color="darkblue", ci_show=False)
    plt.title(f"Overall Survival (Stratified by EGFR)\nLog-Rank p-val: {p_val:.6f}")
    plt.xlabel("Time (Days)")
    plt.ylabel("Survival Probability")
    plt.grid(True, linestyle=":", alpha=0.6)
    
    os.makedirs("docs/plots", exist_ok=True)
    plt.savefig("docs/plots/expression_training_report.png")
    print("[+] Saved analytical report plots to docs/plots/expression_training_report.png")


def main():
    df_expr, df_clinical = generate_synthetic_expression_dataset()
    
    # Run pipeline stages
    df_de = run_differential_expression(df_expr, df_clinical)
    train_subtype_classifier(df_expr, df_clinical)
    kmf_high, kmf_low, p_val = run_survival_analysis(df_expr, df_clinical)
    run_pathway_enrichment(df_de)
    plot_results(df_de, kmf_high, kmf_low, p_val)
    
    # Export datasets to project files for direct platform inspection
    print("\n[STEP 6] Saving Datasets for Workspace Access...")
    os.makedirs("backend/data", exist_ok=True)
    df_expr.to_csv("backend/data/expression_matrix.csv", index=False)
    df_clinical.to_csv("backend/data/clinical_cohort.csv", index=False)
    print("[+] Saved expression_matrix.csv and clinical_cohort.csv to backend/data/")
    
    print("\n==========================================================")
    print("   Gene Expression Pipeline Completed Successfully! ")
    print("==========================================================")


if __name__ == "__main__":
    main()
