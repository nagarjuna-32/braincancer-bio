# NeuroGen AI: Scientific Engine & Extended Architecture Specification

This document details the mathematical models, statistical methods, pipeline stages, AI structures, and multi-omic lifecycle specifications for the **NeuroGen AI** brain cancer research platform.

---

## Part 1: Bioinformatics Pipeline Specifications

### 1. DNA-Seq Somatic Variant Calling Workflow
This pipeline identifies single nucleotide variants (SNVs) and small insertions/deletions (indels) in glioblastoma tissue.

```
Raw FASTQ (Tumor/Normal Pairs)
   ↓
Quality Control [FastQC / Fastp] (Phred Q > 20 filtering)
   ↓
Adapter Trimming [Cutadapt / Trimmomatic]
   ↓
Alignment [BWA-MEM] (Aligned against hg38 reference genome)
   ↓
Coordinate Sorting [Samtools / Picard]
   ↓
Mark Duplicates [Picard MarkDuplicates] (Remove PCR duplicates)
   ↓
Base Quality Recalibration [GATK BQSR] (Correct systematic errors)
   ↓
Somatic Variant Calling [GATK Mutect2] (Tumor vs Normal comparison)
   ↓
Filtering [GATK FilterMutectCalls] (Orientation bias, contamination filters)
   ↓
Variant Annotation [Ensembl VEP / ANNOVAR] (gnomAD, ClinVar, COSMIC databases)
   ↓
Oncoplot & Mutation Spectrum Visualization
```

* **Adapter Trimming Criteria**: Minimum length $L \ge 36\text{ bp}$, sliding window quality threshold $Q \ge 20$.
* **BQSR Recalibration**: Uses a Covariate Model based on machine cycle and dinucleotide context to recalibrate Phred scores against dbSNP database sites.

---

### 2. RNA-Seq & Differential Expression Workflow
Quantifies mRNA expression levels to identify significantly altered genes in brain tumors compared to normal brain tissue.

```
Raw RNA-Seq FASTQ
   ↓
Trimming & Quality Filtering [Cutadapt]
   ↓
Splice-Aware Alignment [STAR Aligner] (Indexed against Gencode hg38 annotation)
   ↓
Read Quantification [featureCounts / HTSeq-count] (Or pseudo-alignment via Salmon)
   ↓
Normalization & Differential Expression [DESeq2 / edgeR] (TMM or Median of Ratios)
   ↓
Wald Test / Dispersion Estimation
   ↓
Volcano Plot & Heatmap Generation
```

#### DESeq2 Mathematical Normalization
DESeq2 models raw read counts $K_{ij}$ for gene $i$ in sample $j$ using a Negative Binomial distribution:
$$K_{ij} \sim \text{NB}(\mu_{ij}, \alpha_i)$$
where $\mu_{ij}$ is the mean expression and $\alpha_i$ is the gene-specific dispersion parameter. 

The mean is modeled as:
$$\mu_{ij} = s_j q_{ij}$$
where $s_j$ is the sample-specific size factor, calculated using the Median-of-Ratios method:
$$s_j = \text{median}_i \frac{K_{ij}}{\left( \prod_{k=1}^N K_{ik} \right)^{1/N}}$$
This normalizes counts against library depth and composition bias.

#### Statistical Testing
To identify differentially expressed genes (DEGs), a **Wald Test** is performed. The null hypothesis $H_0: \beta_i = 0$ (log2 fold change equals zero) is tested using:
$$W = \frac{\hat{\beta}_i}{\text{SE}(\hat{\beta}_i)} \sim N(0, 1)$$
P-values are corrected for multiple testing using the **Benjamini-Hochberg (BH) false discovery rate (FDR)** procedure to control type I errors.

---

### 3. Survival Analysis & Hazard Regression
Tracks overall survival (OS) or progression-free survival (PFS) in glioblastoma cohorts.

#### Kaplan-Meier Estimator
The probability of surviving past time $t$ is calculated as:
$$\hat{S}(t) = \prod_{t_i \le t} \left( 1 - \frac{d_i}{n_i} \right)$$
* $t_i$: A time point where at least one event (death) occurred.
* $d_i$: Number of events (deaths) at time $t_i$.
* $n_i$: Number of patients alive and under observation (at risk) right before time $t_i$.

#### Log-Rank Test
Compares survival profiles of two cohorts (e.g. IDH1-mutant vs. IDH1-wildtype). Under $H_0$, survival curves are identical. The test statistic is:
$$U = \sum_{i=1}^J (O_{1i} - E_{1i})$$
where $O_{1i}$ is the observed events in cohort 1, and $E_{1i}$ is the expected events, computed as:
$$E_{1i} = d_i \left( \frac{n_{1i}}{n_i} \right)$$
The variance of $U$ is:
$$V = \sum_{i=1}^J \frac{n_{1i} n_{2i} d_i (n_i - d_i)}{n_i^2 (n_i - 1)}$$
The test statistic $X^2 = \frac{U^2}{V}$ asymptotically follows a chi-squared distribution with 1 degree of freedom:
$$X^2 \sim \chi^2(1)$$

#### Cox Proportional Hazards Model
Evaluates multi-variable hazard ratios:
$$h(t | X) = h_0(t) \exp(\sum_{k=1}^P \beta_k X_k)$$
where $h_0(t)$ is the baseline hazard, and $\beta_k$ represents the log-hazard ratio for clinical covariate $X_k$ (e.g., age, MGMT methylation status).

---

### 4. Over-Representation & Gene Set Enrichment Analysis (GSEA)
Identifies biological pathways enriched in differentially expressed genes.

#### Hypergeometric Test (ORA)
For a gene list of size $n$, containing $k$ genes from a specific pathway of size $M$, out of a genome background of size $N$, the probability of enrichment due to chance is:
$$P(X \ge k) = \sum_{x=k}^M \frac{\binom{M}{x} \binom{N-M}{n-x}}{\binom{N}{n}}$$
* **Significant Enrichment**: $P \le 0.05$ after BH adjustment.

#### Gene Set Enrichment Analysis (GSEA)
Calculates an Enrichment Score (ES) by walking down a list of genes ranked by log2FC:
* Increment running sum when a gene is in the pathway, weighted by its fold change.
* Decrement running sum when a gene is not in the pathway.
* ES is the maximum deviation from zero. The normalized ES (NES) accounts for pathway size differences.

---

## Part 2: Clinical RAG AI Architecture

NeuroGen AI employs a Retrieval-Augmented Generation (RAG) agent to answer questions using peer-reviewed medical publications.

```
User Query
   ↓
Query Encoder [text-embedding-3-small] (1536-dimensional vector)
   ↓
Vector Search [pgvector / Milvus] (Cosine similarity search)
   ↓
Context Retrieval (Extract top-5 document chunks)
   ↓
Prompt Compiler (Inject retrieved context into template)
   ↓
Large Language Model [GPT-4o / Llama-3]
   ↓
Hallucination Validation (Verify citations against source files)
   ↓
Response with Inline Citations (Markdown output)
```

### RAG Specifications
1. **Embedding Model**: OpenAI `text-embedding-3-small` (1536 dimensions) or local `bge-large-en-v1.5`.
2. **Chunking Strategy**: Recursive Character Text Splitting:
   - Chunk Size: 512 tokens.
   - Chunk Overlap: 64 tokens.
   - Chunks are split at structural boundaries (headers, paragraphs).
3. **Vector Storage**: PostgreSQL database using the `pgvector` extension. Index type: **HNSW (Hierarchical Navigable Small World)** with Cosine distance metric.
4. **Metadata Schema**:
   ```json
   {
     "pmcid": "PMC1042918",
     "title": "IDH1 mutations in diffuse gliomas",
     "author": "Yan et al.",
     "section": "Discussion",
     "project_id": 4
   }
   ```
5. **Prompt Template**:
   ```
   You are the NeuroGen AI Oncology Assistant. Answer the query using the retrieved context blocks. If the context does not contain the answer, state that you do not know. 
   Retrieved Context: {retrieved_chunks}
   Query: {user_query}
   Answer with inline citations (e.g. [PMC1042918]).
   ```
6. **Hallucination Prevention**:
   - **Context Verification**: An NLI (Natural Language Inference) check verifies if the generated statements are entalied by the retrieved chunks.
   - **Strict Sourced Citations**: Citations must map to active document keys stored in the database.

---

## Part 3: Dataset Lifecycle Workflow

All datasets progress through an automated lifecycle pipeline.

```
Upload (API Gateway)
   ↓
Format Validation (Verify magic bytes, file extension, and structure)
   ↓
Virus Scan (ClamAV API)
   ↓
Metadata Extraction (Extract file size, count, read length, reference genome)
   ↓
Background QC Queue (Uvicorn / Celery dispatcher)
   ↓
Permanent Storage (AWS S3-compatible object storage)
   ↓
Analysis Ready (Update database status to "parsed")
   ↓
Cold Storage Archive (Auto-transition to Glacier after 180 days of inactivity)
```

- **Format Validation**:
  - *FASTQ*: Verifies that every 4 lines start with `@`, followed by sequence, `+`, and quality strings.
  - *VCF*: Verifies presence of header starting with `##fileformat=VCF`.
- **Virus Scan**: Files are scanned in memory or in temp folders via `clamd` Unix sockets before permanent storage.

---

## Part 4: Scientific Visualizations Specification

| Visual Type | Description | Required Inputs | Plotly / Cytoscape Mapping |
| :--- | :--- | :--- | :--- |
| **Volcano Plot** | Scatter plot of statistical significance vs fold change. | Gene ID, $\log_2(\text{FC})$, adjusted $p$-value. | X: `log2FC`, Y: $-\log_{10}(P)$. Threshold lines at $|x|=1.5$ and $y=1.3$. |
| **Heatmap** | 2D color matrix of expression profiles. | Gene expression matrix, sample IDs, gene names. | `type: "heatmap"`. Color scale: Blue (low) -> Black (mid) -> Red (high). |
| **Mutation Lollipop** | Mutation frequencies along protein domains. | Variant residues, domain start/end coordinates. | `type: "scatter"` (markers) + vertical line shapes. Domain regions rendered as background rectangles. |
| **Kaplan-Meier Curve** | Survival probability over time. | Days to event, status flag, cohort groups. | `type: "scatter"`, `line: {shape: "hv"}` (step-function). |
| **Pathway Network** | Direct interaction map of signaling cascades. | Pathway gene list, edge connections, expression. | Cytoscape nodes and edges. Nodes color-coded by expression log2FC. |

---

## Part 5: Clinical Imaging (MRI DICOM) Module

Provides structural visualizations of brain tumors.

```
DICOM MRI Upload
   ↓
N4 Bias Field Correction (Correct RF field inhomogeneities)
   ↓
Skull Stripping [FSL BET / deep-learning HD-BET] (Isolate brain tissue)
   ↓
Isotropic Resampling (Resample voxels to 1.0mm isotropic grid)
   ↓
Co-registration [ANTs] (Align T1, T2, FLAIR modalities to MNI152 template space)
   ↓
Tumor Segmentation [3D U-Net] (Delineate ET, TC, and WT regions)
   ↓
Volumetric Calculations (Calculate tumor volume in cubic centimeters)
   ↓
Radiological AI Report Output
```

- **Segmentation Target Classes**:
  1. *GD-enhancing tumor (ET)*
  2. *Peritumoral edema (WT)*
  3. *Necrotic tumor core (TC)*

---

## Part 6: Workflow Pipeline Builder

Provides a drag-and-drop workflow system similar to Galaxy.

```
[FASTQ Dataset] ────> [Fastp QC] ────> [STAR Aligner] ────> [DESeq2] ────> [Volcano Plot]
```

### Node Connection Registry
* **Node Types**: Input, Processing, Analysis, Visualization, Export.
* **Compatibility Rules**:
  - An output socket of type `FASTQ` can only connect to an input socket of type `FASTQ`.
  - An output socket of type `ExpressionMatrix` can connect to `DESeq2` or `Heatmap` input sockets.
* **Execution Engine**: Workflows are compiled into directed acyclic graphs (DAGs) and executed by a Celery workflow runner.

---

## Part 7: Database Design Schema Expansion

To support clinical trial tracking and sample storage, we expand the base database schema with the following tables.

### Extended Table Definitions

#### 1. `patients`
Tracks de-identified patient demographic and clinical outcomes.
- **Columns**:
  - `id`: `INTEGER` (PK)
  - `deidentified_id`: `VARCHAR(100)` (Unique, Indexed)
  - `age_at_diagnosis`: `FLOAT`
  - `gender`: `VARCHAR(20)`
  - `survival_days`: `INTEGER` (Nullable)
  - `vital_status`: `VARCHAR(20)` (Alive, Deceased)

#### 2. `samples`
Tissue pathology and extraction tracking.
- **Columns**:
  - `id`: `INTEGER` (PK)
  - `patient_id`: `INTEGER` (FK -> `patients.id` ON DELETE CASCADE)
  - `tissue_type`: `VARCHAR(50)` (Tumor, Normal, Margin)
  - `tumor_grade`: `VARCHAR(50)` (WHO Grade I-IV)
  - `extraction_date`: `DATE`

#### 3. `sequencing_runs`
Tracks run metadata for raw fastq files.
- **Columns**:
  - `id`: `INTEGER` (PK)
  - `sample_id`: `INTEGER` (FK -> `samples.id` ON DELETE CASCADE)
  - `platform`: `VARCHAR(100)` (Illumina NovaSeq, PacBio, Nanopore)
  - `read_type`: `VARCHAR(50)` (Single-end, Paired-end)
  - `flowcell_id`: `VARCHAR(100)`
  - `run_date`: `DATE`

#### 4. `drugs`
Pharmaceutical database for hypothesis lookup.
- **Columns**:
  - `id`: `INTEGER` (PK)
  - `name`: `VARCHAR(100)` (Unique)
  - `target_pathway`: `VARCHAR(150)` (e.g. EGFR, PI3K)
  - `mechanism`: `TEXT`
  - `fda_status`: `VARCHAR(50)` (Approved, Phase I-III, Experimental)

#### 5. `clinical_trials`
Tracks active clinical trials for brain cancer.
- **Columns**:
  - `id`: `INTEGER` (PK)
  - `nct_id`: `VARCHAR(50)` (Unique, Indexed)
  - `title`: `VARCHAR(255)`
  - `phase`: `VARCHAR(20)`
  - `status`: `VARCHAR(50)` (Recruiting, Active, Completed)
  - `eligibility_criteria`: `TEXT`

---

## Part 8: Plugin Architecture

Allows developers to dynamically register custom analysis pipelines.

```
Plugin Core
   ↓
Metadata Registration (manifest.json)
   ↓
API Hook Registration (Register routes with Gateway)
   ↓
Worker Script Execution (Executes plugin commands in sandboxed python environment)
   ↓
UI Tab Mapping (Inject custom components in project sidebar)
```

### `manifest.json` Specification
```json
{
  "plugin_id": "gsea_enrichment_v1",
  "name": "GSEA Pathway Enrichment",
  "version": "1.0.0",
  "description": "Calculates Normalized Enrichment Scores using MSigDB databases",
  "entrypoint": "gsea_worker.py:run_enrichment",
  "input_types": ["CSV"],
  "output_types": ["JSON", "PNG"]
}
```

---

## Part 9: System Monitoring & Metrics

The platform monitors operational status using Prometheus metrics:

1. **Queue Length**: Number of pending bioinformatics analyses in the Celery/FastAPI queue.
2. **Resource Consumption**: CPU/Memory utilization of active bioinformatics pipelines.
3. **Failed Job Count**: Tracks analysis pipeline failures categorized by type (e.g. alignment failure, file corruption).
4. **Latency Metrics**: API response times for Gateway routing endpoints.
5. **Storage Capacity**: Disk space utilization for S3-compatible buckets.
