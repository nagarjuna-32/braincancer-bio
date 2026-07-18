# NeuroGen AI - Bioinformatics Engine Specification (BES)

**Document Version:** 1.0.0  
**Domain Lead Alignment:** Scientific & Methodological Guidelines  

---

## 1. RNA-Seq Differential Expression Pipeline

### Flowchart:
```text
Upload (CSV / TSV) -> Quality Control -> CPM Normalization -> Log2FC Calculation -> P-Value Estimation -> Volcano Plot & Gene List
```

### Methods & Formulas:
1. **Counts Per Million (CPM):**
   \[
   \text{CPM}_{i,j} = \left( \frac{c_{i,j}}{\sum_{k} c_{k,j}} \right) \times 10^6
   \]
2. **Log2 Fold Change (Log2FC):**
   \[
   \text{Log2FC}_i = \log_2 \left( \frac{\bar{x}_{\text{tumor}, i} + 1}{\bar{x}_{\text{control}, i} + 1} \right)
   \]
3. **Thresholds:**
   - **Statistically Significant:** Adjusted $p\text{-value} \le 0.05$
   - **Biologically Significant:** $|\text{Log2FC}| \ge 1.0$

---

## 2. Somatic Mutation & VCF Pipeline

### Variant Annotation Workflow:
- Input: `.vcf` file containing CHROM, POS, ID, REF, ALT, QUAL, FILTER, INFO.
- Target Driver Mutations:
  - `EGFRvIII` / `EGFR A289V` (Receptor Tyrosine Kinase amplification)
  - `IDH1 R132H` (Cytoplasmic Isocitrate Dehydrogenase 1 mutation defining 2-HG oncometabolite accumulation)
  - `TP53 R273H` (DNA-binding domain inactivation)
  - `MGMT` promoter methylation status (Predicts Temozolomide alkylating chemotherapy sensitivity)

---

## 3. Survival Analysis Pipeline

### Kaplan-Meier Survival Estimator:
\[
\hat{S}(t) = \prod_{t_i \le t} \left( 1 - \frac{d_i}{n_i} \right)
\]
Compares overall survival (OS) in months across IDH1-mutant vs. IDH1-wildtype cohorts.

---

## 4. Multi-Format File Handlers

| Extension | Format | Engine Processing |
|-----------|--------|-------------------|
| `.csv` / `.tsv` | Transcriptomic Matrix | Log2 transformation & CPM normalization |
| `.vcf` | Variant Call Format | Driver mutation filtering & ClinVar annotation |
| `.dcm` | DICOM MRI Image Series | Hounsfield / Grayscale intensity extraction |
| `.nii` / `.nii.gz` | NIfTI Brain Scan Volume | 3D Skull-stripping & spatial alignment |
