"use client";

import React, { useState, useEffect } from "react";
import {
  Brain, HardDrive, Cpu, FileCheck, Users, MessageSquareText,
  UploadCloud, FileText, CheckCircle2, Loader, Play, Sparkles,
  Send, Plus, HelpCircle, BarChart3, AlertCircle, Download,
  Check, Trash2, Search, ArrowRight, Activity, Info, FlaskConical,
  Target, ShieldAlert, Award, Star, ListChecks, Network, BookOpen,
  GitCompare, ChevronRight, History, Edit, CheckSquare, PlusCircle,
  Layers, Server, RefreshCw, Calendar, Clock, Lock, Key, Settings
} from "lucide-react";

// Types
type DiseaseKey =
  | "brain"
  | "lung"
  | "breast"
  | "liver"
  | "colon"
  | "leukemia"
  | "melanoma"
  | "ovarian"
  | "alzheimers"
  | "parkinsons";

interface DiseaseConfig {
  name: string;
  category: string;
  baseConfidence: number;
  progressions: { stage: string; description: string; duration: string }[];
  xaiFactors: { factor: string; weight: number; desc: string }[];
  discoveredGenes: {
    symbol: string;
    chromosome: string;
    proteinName: string;
    function: string;
    mutationTypes: string;
    variants: string;
    brainCancerRole: string;
    pathways: string;
    drugTargets: string;
    proteinLength: number;
    clinicalImportance: string;
    structure: { domains: string[]; activeSites: string[] };
    papers: { title: string; journal: string; year: number; citation: string }[];
  }[];
  biomarkers: { marker: string; significance: string; confidence: number; grade: "Strong" | "Moderate" | "Weak"; rationale: string }[];
  pathways: { node: string; next: string | null; action: string; state: "up" | "down" | "normal" }[];
  similarCohorts: { cohort: string; similarity: number; sharedGenes: string; survivalDays: number; citation: string }[];
  gaps: { gap: string; description: string; opportunity: string }[];
  drugs: { gene: string; target: string; drug: string; trial: string; phase: string; evidence: string }[];
  hypothesis: { observation: string; mechanism: string; prediction: string; paperRef: string };
  defaultOmics: string[];
  
  // v6.0 Features
  causalGraph: { source: string; target: string; weight: number; relation: string }[];
  resistanceMechanisms: { treatment: string; mechanism: string; genes: string; literature: string };
  drugCombinations: { combo: string; synergyScore: number; trials: string; toxicity: string }[];
  singleCellClusters: { name: string; markerGenes: string; proportion: number; communication: string }[];
  spatialTissueData: { x: number; y: number; cellType: string; expression: number }[];
  tumorBoard: { role: string; expert: string; comment: string }[];
  longitudinalVisits: { visit: string; mriSize: string; mutations: string; trajectory: string }[];
  modelGovernance: { model: string; datasetSize: string; approvalStatus: string; biasScore: number };
}

// Data dictionary for all 10 diseases
const DISEASES: Record<DiseaseKey, DiseaseConfig> = {
  brain: {
    name: "Glioblastoma Multiforme (GBM)",
    category: "Oncology",
    baseConfidence: 96,
    defaultOmics: ["DNA", "RNA", "MRI", "Clinical Data"],
    progressions: [
      { stage: "Healthy Glial Cells", description: "Astrocytes and oligodendrocytes maintain brain homeostasis.", duration: "Baseline" },
      { stage: "Somatic Mutation", description: "IDH1 R132H or TP53 somatic mutation initiates astrocytic migration.", duration: "Years 1-3" },
      { stage: "Early Disease (Grade II/III)", description: "Loss of ATRX and CDKN2A deletion drives localized cellular proliferation.", duration: "Years 3-5" },
      { stage: "Advanced Glioblastoma (Grade IV)", description: "EGFR amplification and PTEN loss triggers necrotic microvascular palisading.", duration: "Months 6-12" }
    ],
    xaiFactors: [
      { factor: "EGFRvIII Somatic Amplification", weight: 32, desc: "Identified high-copy focal amplification on Chromosome 7." },
      { factor: "MRI Contrast Enhancement Volume", weight: 24, desc: "T1ce radiological scans indicate a 4.2cm³ vascularized ring-enhancing mass." },
      { factor: "Clinical Patient Features", weight: 22, desc: "Patient age (58) combined with rapid-onset focal seizure symptoms." },
      { factor: "TP53 Missense Mutation", weight: 18, desc: "Loss of G2 cell-cycle checkpoint arrest capability in DNA repair." }
    ],
    discoveredGenes: [
      {
        symbol: "EGFR",
        chromosome: "7",
        proteinName: "Epidermal Growth Factor Receptor",
        function: "Receptor tyrosine kinase governing cell division, motility, and survival.",
        mutationTypes: "EGFRvIII (Exon 2-7 deletion), somatic amplification.",
        variants: "EGFRvIII, L858R, T790M",
        brainCancerRole: "Hyperactivates downstream PI3K/AKT/mTOR cascades promoting rapid cell growth.",
        pathways: "MAPK cascade, PI3K/AKT pathway",
        drugTargets: "Gefitinib, Erlotinib, Osimertinib",
        proteinLength: 1210,
        clinicalImportance: "Indicates eligibility for targeted kinase inhibitor clinical studies.",
        structure: {
          domains: ["Extracellular Ligand-Binding", "Transmembrane Segment", "Intracellular Tyrosine Kinase Domain"],
          activeSites: ["ATP Binding Pocket (Lys745)", "Autophosphorylation Domain (Tyr1173)"]
        },
        papers: [
          { title: "EGFRvIII mutations in glioblastoma: clinical relevance", journal: "NEJM", year: 2005, citation: "Stupp et al., 2005" }
        ]
      }
    ],
    biomarkers: [
      { marker: "MGMT Promoter Methylation", significance: "Predictive Biomarker", confidence: 97, grade: "Strong", rationale: "Epigenetic silencing of MGMT prevents repair of Temozolomide-induced DNA damage, predicting long-term survival." },
      { marker: "IDH1 R132H Mutation", significance: "Diagnostic & Prognostic Biomarker", confidence: 94, grade: "Strong", rationale: "Differentiates secondary glioblastomas/astrocytomas from primary GBM. Correlates with significantly longer median overall survival." }
    ],
    pathways: [
      { node: "EGFR Mutation", next: "PI3K Activation", action: "Constitutive signaling", state: "up" },
      { node: "PI3K Activation", next: "PTEN Inhibition", action: "Phosphorylates PIP2 to PIP3", state: "up" },
      { node: "PTEN Inhibition", next: "AKT Phosphorylation", action: "Loss of negative regulation", state: "down" },
      { node: "AKT Phosphorylation", next: "mTOR Activation", action: "Downstream survival cascade", state: "up" },
      { node: "mTOR Activation", next: null, action: "Uncontrolled proliferation", state: "up" }
    ],
    similarCohorts: [
      { cohort: "TCGA-GBM-A28", similarity: 93.4, sharedGenes: "EGFR Amp, PTEN Loss, MGMT Unmethylated", survivalDays: 412, citation: "TCGA Cell Rep 2013" }
    ],
    gaps: [
      { gap: "EGFRvIII Vaccine Escape", description: "Therapies targeting EGFRvIII fail due to antigen loss and subsequent outgrowth of EGFR-wild-type clones.", opportunity: "Investigate polyvalent antibody-drug conjugates targeting alternative EGFR epitopes." }
    ],
    drugs: [
      { gene: "EGFR", target: "Tyrosine Kinase Domain", drug: "Osimertinib", trial: "NCT04830122", phase: "Phase II", evidence: "Strong - Preclinical efficacy in brain-penetrating gliomas." }
    ],
    hypothesis: {
      observation: "Reduced PTEN expression is paired with EGFRvIII activation.",
      mechanism: "Constitutive PI3K activation escapes feedback inhibition by mTOR complex 2.",
      prediction: "Dual inhibition of PI3K alpha and mTORC1/2 will induce apoptotic synergy in PTEN-null cells.",
      paperRef: "Mellinghoff et al., Cancer Discovery 2021"
    },
    causalGraph: [
      { source: "EGFR Amplification", target: "PI3K Hyper-activation", weight: 92, relation: "direct cause" },
      { source: "PI3K Hyper-activation", target: "AKT Phosphorylation", weight: 88, relation: "facilitates" },
      { source: "AKT Phosphorylation", target: "mTOR Transcriptional Lock", weight: 85, relation: "activates" },
      { source: "mTOR Transcriptional Lock", target: "G1/S Phase Transition", weight: 81, relation: "induces" }
    ],
    resistanceMechanisms: {
      treatment: "Temozolomide (TMZ)",
      mechanism: "Mismatch repair pathway inactivation (MSH6 deletion) combined with high MGMT activity bypasses cell cycle arrest.",
      genes: "MGMT, MSH6, DNA polymerase eta",
      literature: "Hunter et al., Neuro-Oncology 2021"
    },
    drugCombinations: [
      { combo: "Osimertinib + Everolimus", synergyScore: 84.5, trials: "NCT04381023 (Phase II)", toxicity: "Grade 1-2 diarrhea, stomatitis" }
    ],
    singleCellClusters: [
      { name: "Glioma Stem-like Cells", markerGenes: "PROM1 (CD133), SOX2, NES", proportion: 24, communication: "Secrete VEGF promoting endothelial cell migration." },
      { name: "TAMs (Macrophages)", markerGenes: "CD68, CD163, TGFB1", proportion: 42, communication: "Release TGF-beta inhibiting CD8+ T-cells." }
    ],
    spatialTissueData: [
      { x: 1, y: 1, cellType: "Necrotic Core", expression: 0.1 },
      { x: 1, y: 2, cellType: "Vascular Border", expression: 2.8 },
      { x: 2, y: 1, cellType: "Glioma Edge", expression: 3.4 },
      { x: 2, y: 2, cellType: "Infiltrating Glial", expression: 1.6 }
    ],
    tumorBoard: [
      { role: "Oncologist", expert: "Dr. L. Saria", comment: "The patient presents with rapid cognitive decline. We need to initiate Temozolomide but must note that MGMT promoter is unmethylated." },
      { role: "Radiologist", expert: "Dr. A. Taylor", comment: "MRI T1ce reveals a large 4.2cm³ enhancing border in the temporal lobe. High vascularity is evident." }
    ],
    longitudinalVisits: [
      { visit: "Visit 1 (Baseline)", mriSize: "4.2cm³ enhancing", mutations: "EGFRvIII, TP53 missense", trajectory: "High initial hazard index" },
      { visit: "Visit 2 (Post-Op + TMZ)", mriSize: "1.1cm³ residual", mutations: "EGFRvIII down, MGMT high", trajectory: "Temporary stabilization" }
    ],
    modelGovernance: {
      model: "NeuroGen-GBM-Classifier-v4",
      datasetSize: "2,400 patients (TCGA + CGGA)",
      approvalStatus: "Validated - IRB Certified",
      biasScore: 0.04
    }
  },
  lung: {
    name: "Lung Adenocarcinoma (NSCLC)",
    category: "Oncology",
    baseConfidence: 94,
    defaultOmics: ["DNA", "RNA", "Clinical Data"],
    progressions: [
      { stage: "Normal Airway", description: "Healthy bronchial epithelial cells exposed to environmental carcinogens.", duration: "Baseline" },
      { stage: "Carcinogen Insult", description: "Accumulation of mutation signatures related to smoke.", duration: "Years 1-10" }
    ],
    xaiFactors: [
      { factor: "EGFR L858R Point Mutation", weight: 42, desc: "Exon 21 missense variant causing structural tyrosine kinase activation." },
      { factor: "CT Chest Ground-Glass Nodule", weight: 28, desc: "Solid and ground-glass component measuring 2.4cm in right upper lobe." }
    ],
    discoveredGenes: [
      {
        symbol: "EGFR",
        chromosome: "7",
        proteinName: "Epidermal Growth Factor Receptor",
        function: "Governs MAPK and AKT pathway signaling in epithelial cells.",
        mutationTypes: "Exon 19 deletion, Exon 21 L858R mutation.",
        variants: "L858R, Exon 19 del",
        brainCancerRole: "Drives adenocarcinogenesis in non-smoking patients.",
        pathways: "MAPK cascade, RAS/RAF/MEK/ERK",
        drugTargets: "Erlotinib, Gefitinib, Osimertinib",
        proteinLength: 1210,
        clinicalImportance: "Osimertinib is standard first-line therapy for EGFR-mutant metastatic NSCLC.",
        structure: {
          domains: ["Ligand Binding Domain", "Transmembrane Domain", "TK Catalytic domain"],
          activeSites: ["Leucine 858 Hotspot"]
        },
        papers: [
          { title: "Osimertinib in untreated EGFR-mutated advanced NSCLC", journal: "NEJM", year: 2018, citation: "Soria et al., 2018" }
        ]
      }
    ],
    biomarkers: [
      { marker: "PD-L1 Tumor Proportion Score (TPS)", significance: "Predictive Biomarker", confidence: 95, grade: "Strong", rationale: "TPS >= 50% directs first-line single-agent Pembrolizumab immunotherapy." }
    ],
    pathways: [
      { node: "EGFR L858R", next: "KRAS Activation", action: "Ligand-independent signaling", state: "up" },
      { node: "KRAS Activation", next: null, action: "ERK pathway active", state: "up" }
    ],
    similarCohorts: [
      { cohort: "TCGA-LUAD-E09", similarity: 91.2, sharedGenes: "EGFR L858R, TP53 wild-type", survivalDays: 850, citation: "TCGA Nature 2014" }
    ],
    gaps: [
      { gap: "KRAS G12C Resistance", description: "Secondary mutations in the drug-binding pocket or bypass activation of MET drive resistance.", opportunity: "Combine KRAS-G12C inhibitors with SHP2 or EGFR inhibitors." }
    ],
    drugs: [
      { gene: "KRAS", target: "Cysteine-12 Pocket", drug: "Sotorasib", trial: "NCT03600883", phase: "FDA Approved", evidence: "Strong" }
    ],
    hypothesis: {
      observation: "Metastatic LUAD with ALK fusion develops resistance to Alectinib.",
      mechanism: "Secondary mutations (e.g., G1202R) modify the binding pocket geometry.",
      prediction: "Lorlatinib will bind effectively to G1202R mutants.",
      paperRef: "Shaw et al., Lancet Oncology 2018"
    },
    causalGraph: [
      { source: "EGFR L858R Mutation", target: "RAS GTP Loading", weight: 94, relation: "direct cause" },
      { source: "RAS GTP Loading", target: "RAF Phosphorylation", weight: 89, relation: "induces" }
    ],
    resistanceMechanisms: {
      treatment: "Osimertinib",
      mechanism: "Somatic emergence of C797S mutation in Exon 20 prevents Osimertinib covalent binding.",
      genes: "EGFR C797S, MET Amplification",
      literature: "Oxnard et al., JAMA Oncology 2018"
    },
    drugCombinations: [
      { combo: "Osimertinib + Savolitinib", synergyScore: 82.1, trials: "SAVANNAH study (Phase II)", toxicity: "Skin rash, liver enzyme elevation" }
    ],
    singleCellClusters: [
      { name: "Alveolar Type II Cells", markerGenes: "SFTPC, SFTPA1", proportion: 32, communication: "Act as cell of origin under EGFR driver mutation." }
    ],
    spatialTissueData: [
      { x: 1, y: 1, cellType: "Normal Alveolar", expression: 0.2 },
      { x: 2, y: 2, cellType: "Adenocarcinoma Core", expression: 4.1 }
    ],
    tumorBoard: [
      { role: "Oncologist", expert: "Dr. J. Soria", comment: "We will start Osimertinib given the EGFR L858R status. The brain penetrability is excellent." }
    ],
    longitudinalVisits: [
      { visit: "Visit 1", mriSize: "2.4cm Nodule", mutations: "EGFR L858R", trajectory: "Indicated for Targeted Therapy" }
    ],
    modelGovernance: {
      model: "NeuroGen-Lung-Classifier-v2",
      datasetSize: "1,800 patients (TCGA-LUAD)",
      approvalStatus: "Validated",
      biasScore: 0.05
    }
  },
  breast: {
    name: "HER2+ Invasive Ductal Breast Carcinoma",
    category: "Oncology",
    baseConfidence: 97,
    defaultOmics: ["DNA", "RNA", "Epigenetics", "Clinical Data"],
    progressions: [
      { stage: "Normal Duct", description: "Healthy breast ductal epithelial cells with baseline ER/PR/HER2 levels.", duration: "Baseline" }
    ],
    xaiFactors: [
      { factor: "ERBB2 (HER2) Gene Amplification", weight: 48, desc: "High-level amplification detected by FISH ratio > 3.2." },
      { factor: "Progesterone/Estrogen Receptor Negative", weight: 22, desc: "ER/PR staining < 1%, indicating hormone-independent growth." }
    ],
    discoveredGenes: [
      {
        symbol: "ERBB2",
        chromosome: "17",
        proteinName: "Receptor Tyrosine-Protein Kinase erbB-2 (HER2)",
        function: "Coordinates homodimerization and heterodimerization to activate growth programs.",
        mutationTypes: "Gene amplification, focal somatic mutations in kinase domain.",
        variants: "Amplification",
        brainCancerRole: "Drives aggressive, rapidly growing breast cancer subsets.",
        pathways: "PI3K/AKT, MAPK cascades",
        drugTargets: "Trastuzumab, Pertuzumab",
        proteinLength: 1255,
        clinicalImportance: "Confirms benefit for dual HER2-targeted therapies.",
        structure: {
          domains: ["Extracellular Domain (ECD)", "Transmembrane Region", "Intracellular Kinase Domain"],
          activeSites: ["Pertuzumab binding loop"]
        },
        papers: [
          { title: "Adjuvant Herceptin in HER2-positive breast cancer", journal: "NEJM", year: 2005, citation: "Slamon et al., 2005" }
        ]
      }
    ],
    biomarkers: [
      { marker: "HER2 Expression (IHC 3+)", significance: "Diagnostic & Predictive Biomarker", confidence: 99, grade: "Strong", rationale: "IHC 3+ confirms cell-surface HER2 density, predicting response to antibody-drug conjugates (Trastuzumab deruxtecan)." }
    ],
    pathways: [
      { node: "HER2 Amplification", next: "HER2/HER3 Heterodimer", action: "Spontaneous activation", state: "up" },
      { node: "HER2/HER3 Heterodimer", next: null, action: "PI3K signaling activated", state: "up" }
    ],
    similarCohorts: [
      { cohort: "TCGA-BRCA-H88", similarity: 95.8, sharedGenes: "ERBB2 Amp, ER-/PR-", survivalDays: 1450, citation: "TCGA Nature 2012" }
    ],
    gaps: [
      { gap: "HER2 Brain Metastasis Resistance", description: "Systemic antibodies do not cross the blood-brain barrier effectively, leading to CNS recurrence.", opportunity: "Test small molecule tyrosine kinase inhibitors." }
    ],
    drugs: [
      { gene: "ERBB2", target: "Domain IV (ECD)", drug: "Trastuzumab deruxtecan", trial: "DESTINY-Breast03", phase: "FDA Approved", evidence: "Strong" }
    ],
    hypothesis: {
      observation: "HER2+ breast cancer develops resistance to Trastuzumab.",
      mechanism: "Expression of truncated p95HER2 isoform lacking the extracellular antibody binding domain.",
      prediction: "Small-molecule lapatinib or tucatinib will remain effective as they target the intracellular kinase pocket.",
      paperRef: "Scaltriti et al., JNCI 2007"
    },
    causalGraph: [
      { source: "HER2 Amplification", target: "HER2/HER3 Heterodimerization", weight: 95, relation: "direct cause" },
      { source: "HER2/HER3 Heterodimerization", target: "p85 subunit binding", weight: 91, relation: "promotes" }
    ],
    resistanceMechanisms: {
      treatment: "Trastuzumab",
      mechanism: "Cleavage of HER2 extracellular domain leaves active p95HER2 fragment which does not bind the antibody.",
      genes: "ERBB2 splice variant, MUC4 masking glycoprotein",
      literature: "Scaltriti et al., JNCI 2007"
    },
    drugCombinations: [
      { combo: "Trastuzumab + Tucatinib", synergyScore: 89.1, trials: "HER2CLIMB (Phase III)", toxicity: "Mild-moderate hand-foot syndrome" }
    ],
    singleCellClusters: [
      { name: "Luminal Progenitors", markerGenes: "KRT19, GATA3, ERBB2", proportion: 38, communication: "Hyper-responsive to receptor dimer growth stimulation." }
    ],
    spatialTissueData: [
      { x: 1, y: 1, cellType: "Stroma", expression: 0.1 },
      { x: 2, y: 2, cellType: "Ductal Lesion", expression: 4.8 }
    ],
    tumorBoard: [
      { role: "Oncologist", expert: "Dr. D. Slamon", comment: "Given the high Ki-67 index and HER2 amplification, dual blockade is indicated." }
    ],
    longitudinalVisits: [
      { visit: "Visit 1", mriSize: "3.1cm Dense mass", mutations: "HER2 high amplification", trajectory: "Targeted block planned" }
    ],
    modelGovernance: {
      model: "NeuroGen-Breast-Classifier-v3",
      datasetSize: "3,100 patients (TCGA-BRCA)",
      approvalStatus: "Approved - FDA 510(k)",
      biasScore: 0.03
    }
  },
  liver: {
    name: "Hepatocellular Carcinoma (HCC)",
    category: "Oncology",
    baseConfidence: 92,
    defaultOmics: ["DNA", "RNA", "Clinical Data"],
    progressions: [
      { stage: "Cirrhosis", description: "Chronic hepatocyte injury leading to fibrous scar tissue deposition.", duration: "5-10 Years" }
    ],
    xaiFactors: [
      { factor: "CTNNB1 Mutation Locus", weight: 38, desc: "Exon 3 missense mutation activating Wnt/beta-catenin pathway." },
      { factor: "Serum Alpha-Fetoprotein (AFP > 400)", weight: 32, desc: "Marked biochemical elevation indicating liver oncogenesis." }
    ],
    discoveredGenes: [
      {
        symbol: "CTNNB1",
        chromosome: "3",
        proteinName: "Beta-Catenin",
        function: "Coordinates cell-cell adhesion and initiates Wnt target gene transcription.",
        mutationTypes: "Exon 3 somatic hotspots (S33Y, D32Y).",
        variants: "S33Y, D32Y",
        brainCancerRole: "Promotes immune exclusion and rapid growth in liver tumors.",
        pathways: "Wnt/Beta-catenin cascade",
        drugTargets: "Porcupine inhibitors, Wnt pathway blockers",
        proteinLength: 781,
        clinicalImportance: "Mutant CTNNB1 liver tumors demonstrate resistance to immune checkpoint blockades.",
        structure: {
          domains: ["N-terminal phosphorylation region", "Armadillo Repeat domain"],
          activeSites: ["Phosphorylation loop (Ser33)"]
        },
        papers: [
          { title: "CTNNB1 mutations in hepatocellular carcinoma: targetable pathways", journal: "Journal of Hepatology", year: 2019, citation: "Llovet et al., 2019" }
        ]
      }
    ],
    biomarkers: [
      { marker: "Alpha-Fetoprotein (AFP)", significance: "Diagnostic & Prognostic Biomarker", confidence: 91, grade: "Strong", rationale: "Highly elevated AFP in a cirrhotic patient indicates HCC development." }
    ],
    pathways: [
      { node: "CTNNB1 Mutation", next: "Beta-catenin Stabilization", action: "Evasion of destruction complex", state: "up" },
      { node: "Beta-catenin Stabilization", next: null, action: "CCND1 transcription", state: "up" }
    ],
    similarCohorts: [
      { cohort: "TCGA-LIHC-B04", similarity: 90.1, sharedGenes: "CTNNB1 mutant, TERT promoter wild-type", survivalDays: 610, citation: "TCGA Cell 2017" }
    ],
    gaps: [
      { gap: "Immune Exclusion in CTNNB1-mutant HCC", description: "Wnt activation blocks microglial recruitment, leading to cold tumors.", opportunity: "Combine Wnt inhibitors with VEGF-A blocking antibodies." }
    ],
    drugs: [
      { gene: "VEGFA", target: "VEGFR binding loop", drug: "Atezolizumab + Bevacizumab", trial: "IMbrave150", phase: "Standard of Care", evidence: "Strong" }
    ],
    hypothesis: {
      observation: "CTNNB1 mutant HCC avoids T-cell filtration.",
      mechanism: "Reduced CCL5 chemokines inhibit dendritic cell maturation.",
      prediction: "Direct chemokine receptor agonists will restore immunotherapy response.",
      paperRef: "Llovet et al., Lancet 2020"
    },
    causalGraph: [
      { source: "CTNNB1 somatic mutation", target: "Beta-catenin accumulation", weight: 93, relation: "direct cause" },
      { source: "Beta-catenin accumulation", target: "Immune cell exclusion", weight: 87, relation: "drives" }
    ],
    resistanceMechanisms: {
      treatment: "Sorafenib",
      mechanism: "Activation of MAPK bypass pathways or EGFR reactivation overrides Sorafenib kinase inhibition.",
      genes: "EGFR, phospho-ERK",
      literature: "Llovet et al., Lancet 2008"
    },
    drugCombinations: [
      { combo: "Atezolizumab + Bevacizumab", synergyScore: 86.4, trials: "IMbrave150 (Phase III)", toxicity: "Hypertension, bleeding risk" }
    ],
    singleCellClusters: [
      { name: "Hepatocytes", markerGenes: "ALB, APOB", proportion: 62, communication: "Differentiate into cancerous state under cellular stress." }
    ],
    spatialTissueData: [
      { x: 1, y: 1, cellType: "Scirrhous Stroma", expression: 0.1 },
      { x: 2, y: 2, cellType: "Tumor Nodule Core", expression: 3.2 }
    ],
    tumorBoard: [
      { role: "Oncologist", expert: "Dr. J. Llovet", comment: "We will initiate Atezolizumab + Bevacizumab combination therapy." }
    ],
    longitudinalVisits: [
      { visit: "Visit 1", mriSize: "3.4cm liver mass", mutations: "CTNNB1 mutant", trajectory: "Initiated systemic therapy" }
    ],
    modelGovernance: {
      model: "NeuroGen-Liver-HCC-v1",
      datasetSize: "950 patients (TCGA-LIHC)",
      approvalStatus: "CE Marked",
      biasScore: 0.05
    }
  },
  colon: {
    name: "Colorectal Adenocarcinoma (CRC)",
    category: "Oncology",
    baseConfidence: 95,
    defaultOmics: ["DNA", "RNA", "Clinical Data"],
    progressions: [
      { stage: "Normal Crypt", description: "Healthy intestinal epithelial crypts maintaining homeostatic cell division.", duration: "Baseline" }
    ],
    xaiFactors: [
      { factor: "APC Frameshift Deletion", weight: 42, desc: "Early loss-of-function truncation in Exon 15 of APC." },
      { factor: "KRAS Exon 2 (G12D) Mutation", weight: 34, desc: "Somatic activation locking GTPase signaling to ON state." }
    ],
    discoveredGenes: [
      {
        symbol: "APC",
        chromosome: "5",
        proteinName: "Adenomatous Polyposis Coli Protein",
        function: "Negative regulator of beta-catenin signaling; key gatekeeper of colonic epithelium.",
        mutationTypes: "Frameshift deletions, nonsense mutations leading to truncated protein.",
        variants: "R876X, Exon 15 deletion",
        brainCancerRole: "Loss of APC triggers uncontrolled Wnt signaling.",
        pathways: "Wnt signaling pathway",
        drugTargets: "Beta-catenin inhibitors",
        proteinLength: 2843,
        clinicalImportance: "Early driver; confirms classical chromosomal instability (CIN) path.",
        structure: {
          domains: ["Oligomerization domain", "Armadillo repeat region"],
          activeSites: ["Beta-catenin 20-aa repeats"]
        },
        papers: [
          { title: "Genomic landscape of colorectal cancer", journal: "Nature", year: 2012, citation: "TCGA Network, 2012" }
        ]
      }
    ],
    biomarkers: [
      { marker: "Microsatellite Instability Status (MSI-H)", significance: "Predictive Biomarker", confidence: 96, grade: "Strong", rationale: "MSI-High status predicts excellent clinical benefit from anti-PD1 immunotherapy." }
    ],
    pathways: [
      { node: "APC Truncation", next: "Wnt Path Hyper-activation", action: "Destruction complex failure", state: "up" },
      { node: "Wnt Path Hyper-activation", next: null, action: "KRAS active", state: "up" }
    ],
    similarCohorts: [
      { cohort: "TCGA-COAD-D02", similarity: 92.4, sharedGenes: "APC truncated, KRAS G12D", survivalDays: 1100, citation: "TCGA Nature 2012" }
    ],
    gaps: [
      { gap: "MSS Colorectal Cancer Cold Tumor", description: "Microsatellite stable (MSS) tumors escape immune detection.", opportunity: "Test combinations of MEK inhibitors with immune checkpoint blockade." }
    ],
    drugs: [
      { gene: "VEGFA", target: "Growth ligand bind", drug: "Regorafenib", trial: "CORRECT study", phase: "Approved", evidence: "Moderate" }
    ],
    hypothesis: {
      observation: "APC loss is followed by KRAS somatic mutation.",
      mechanism: "Wnt signaling up-regulates MYC, accelerating replication stress.",
      prediction: "Early intervention using Wnt pathway inhibitors will delay transition.",
      paperRef: "Vogelstein et al., Science 1988"
    },
    causalGraph: [
      { source: "APC somatic deletion", target: "Beta-catenin stabilization", weight: 94, relation: "direct cause" },
      { source: "Beta-catenin stabilization", target: "Adenoma development", weight: 89, relation: "drives" }
    ],
    resistanceMechanisms: {
      treatment: "Cetuximab (Anti-EGFR)",
      mechanism: "Downstream somatic mutations in KRAS or NRAS bypass Cetuximab-mediated receptor blockade.",
      genes: "KRAS G12D, NRAS Q61K",
      literature: "Vogelstein et al., NEJM 2013"
    },
    drugCombinations: [
      { combo: "Encorafenib + Cetuximab", synergyScore: 87.1, trials: "BEACON CRC (Phase III)", toxicity: "Dermatitis, diarrhea" }
    ],
    singleCellClusters: [
      { name: "Colonocytes", markerGenes: "APC, CDX2", proportion: 54, communication: "Undergo adenoma-carcinoma sequence." }
    ],
    spatialTissueData: [
      { x: 1, y: 1, cellType: "Normal Mucosa", expression: 0.1 },
      { x: 2, y: 2, cellType: "Infiltrative Front", expression: 3.6 }
    ],
    tumorBoard: [
      { role: "Oncologist", expert: "Dr. B. Vogelstein", comment: "The tumor is MSS but harbors KRAS G12D mutation. We should prepare FOLFOX." }
    ],
    longitudinalVisits: [
      { visit: "Visit 1", mriSize: "3.2cm sigmoid mass", mutations: "APC truncated, KRAS mutant", trajectory: "Surgical planning" }
    ],
    modelGovernance: {
      model: "NeuroGen-Colon-Classifier-v2",
      datasetSize: "2,100 patients (TCGA-COAD)",
      approvalStatus: "CE Marked",
      biasScore: 0.04
    }
  },
  leukemia: {
    name: "Acute Myeloid Leukemia (AML)",
    category: "Oncology",
    baseConfidence: 93,
    defaultOmics: ["DNA", "RNA", "Clinical Data"],
    progressions: [
      { stage: "Pre-leukemia", description: "Clonal hematopoiesis of indeterminate potential with DNMT3A mutations.", duration: "Years" }
    ],
    xaiFactors: [
      { factor: "FLT3-ITD Somatic Duplication", weight: 46, desc: "Internal tandem duplication detected in juxtamembrane domain." },
      { factor: "NPM1 Frame-shift insertion", weight: 32, desc: "Exon 12 frameshift mutation driving aberrant cytoplasmic localization." }
    ],
    discoveredGenes: [
      {
        symbol: "FLT3",
        chromosome: "13",
        proteinName: "Fms-Related Tyrosine Kinase 3",
        function: "Receptor tyrosine kinase governing early hematopoiesis and proliferation.",
        mutationTypes: "Internal Tandem Duplication (ITD), TKD point mutations.",
        variants: "FLT3-ITD, FLT3-D835Y",
        brainCancerRole: "Constitutive activation drives bone marrow blast proliferation.",
        pathways: "MAPK cascade, PI3K/AKT cascade",
        drugTargets: "Midostaurin, Gilteritinib",
        proteinLength: 993,
        clinicalImportance: "FLT3-ITD indicates an aggressive clinical course.",
        structure: {
          domains: ["Juxtamembrane domain", "Tyrosine kinase domains"],
          activeSites: ["Juxtamembrane duplication locus"]
        },
        papers: [
          { title: "Gilteritinib or chemotherapy in FLT3-mutated AML", journal: "NEJM", year: 2019, citation: "Perl et al., 2019" }
        ]
      }
    ],
    biomarkers: [
      { marker: "FLT3-ITD Mutational Load", significance: "Prognostic & Predictive Biomarker", confidence: 95, grade: "Strong", rationale: "High FLT3-ITD ratio correlates with early relapse, guiding stem cell transplantation." }
    ],
    pathways: [
      { node: "FLT3-ITD Duplication", next: "STAT5 Phosphorylation", action: "Ligand-free phosphorylation", state: "up" },
      { node: "STAT5 Phosphorylation", next: null, action: "MYC Up-regulation", state: "up" }
    ],
    similarCohorts: [
      { cohort: "TCGA-LAML-F02", similarity: 94.1, sharedGenes: "FLT3-ITD+, NPM1 mutant", survivalDays: 320, citation: "TCGA NEJM 2013" }
    ],
    gaps: [
      { gap: "FLT3 TKI Gatekeeper Resistance", description: "Secondary mutations in the FLT3 kinase domain block Gilteritinib binding.", opportunity: "Develop type I inhibitors targeting the inactive kinase conformation." }
    ],
    drugs: [
      { gene: "FLT3", target: "TKD active pocket", drug: "Gilteritinib", trial: "ADMIRAL study", phase: "Approved", evidence: "Strong" }
    ],
    hypothesis: {
      observation: "FLT3-ITD blast cell division is blocked by cytarabine but relapses quickly.",
      mechanism: "Persistent leukemic stem cell clones (LSCs) reside in protective niches.",
      prediction: "Combining Gilteritinib with CXCR4 antagonists will mobilize LSCs.",
      paperRef: "Perl et al., NEJM 2019"
    },
    causalGraph: [
      { source: "FLT3-ITD duplication", target: "STAT5 dimerization", weight: 92, relation: "direct cause" },
      { source: "STAT5 dimerization", target: "Differentiation arrest", weight: 88, relation: "promotes" }
    ],
    resistanceMechanisms: {
      treatment: "Gilteritinib",
      mechanism: "Emergence of NRAS mutations or secondary FLT3 gatekeeper F691L mutations bypass TKI binding.",
      genes: "FLT3 F691L, NRAS G12D",
      literature: "Perl et al., NEJM 2019"
    },
    drugCombinations: [
      { combo: "Venetoclax + Azacitidine", synergyScore: 91.2, trials: "VIALE-A (Phase III)", toxicity: "Neutropenia, thrombocytopenia" }
    ],
    singleCellClusters: [
      { name: "Myeloblasts", markerGenes: "CD34, CD117 (KIT)", proportion: 78, communication: "Accumulate in bone marrow, blocking healthy hematopoiesis." }
    ],
    spatialTissueData: [
      { x: 1, y: 1, cellType: "Bone Marrow Niche", expression: 3.1 }
    ],
    tumorBoard: [
      { role: "Oncologist", expert: "Dr. E. Perl", comment: "High blast count confirmed. We must initiate induction chemotherapy." }
    ],
    longitudinalVisits: [
      { visit: "Visit 1", mriSize: "85% bone marrow blasts", mutations: "FLT3-ITD", trajectory: "High risk profile" }
    ],
    modelGovernance: {
      model: "NeuroGen-AML-Classifier-v1",
      datasetSize: "1,100 patients (TCGA-LAML)",
      approvalStatus: "Validated",
      biasScore: 0.05
    }
  },
  melanoma: {
    name: "Cutaneous Melanoma",
    category: "Oncology",
    baseConfidence: 94,
    defaultOmics: ["DNA", "RNA", "Clinical Data"],
    progressions: [
      { stage: "Normal Melanocyte", description: "Healthy melanocytes in basal epidermal layers exposed to UV radiation.", duration: "Baseline" }
    ],
    xaiFactors: [
      { factor: "BRAF V600E Point Mutation", weight: 48, desc: "T-to-A transversion in Exon 15 substituting Valine to Glutamate." },
      { factor: "CDKN2A Deletion Status", weight: 26, desc: "Homozygous loss of p16INK4a causing cell cycle G1/S release." }
    ],
    discoveredGenes: [
      {
        symbol: "BRAF",
        chromosome: "7",
        proteinName: "Serine/threonine-protein kinase B-Raf",
        function: "Kinase in the MAPK pathway regulating transcription programs.",
        mutationTypes: "Exon 15 somatic point mutation (V600E).",
        variants: "V600E, V600K",
        brainCancerRole: "Hyperactivates downstream MEK/ERK signaling, promoting melanoma growth.",
        pathways: "MAPK cascade, RAS/RAF/MEK/ERK",
        drugTargets: "Vemurafenib, Dabrafenib, Encorafenib",
        proteinLength: 766,
        clinicalImportance: "Confirms susceptibility to dual BRAF/MEK inhibitors.",
        structure: {
          domains: ["CR1 conserved region", "CR3 kinase domain"],
          activeSites: ["Activation segment (Val600)"]
        },
        papers: [
          { title: "Improved survival with vemurafenib in melanoma", journal: "NEJM", year: 2011, citation: "Chapman et al., 2011" }
        ]
      }
    ],
    biomarkers: [
      { marker: "BRAF V600 Mutation Status", significance: "Diagnostic & Predictive Biomarker", confidence: 98, grade: "Strong", rationale: "Presence of V600E directs first-line combination BRAF/MEK inhibitors or immunotherapy." }
    ],
    pathways: [
      { node: "BRAF V600E", next: "MEK1 Phosphorylation", action: "Constitutive monomer activation", state: "up" },
      { node: "MEK1 Phosphorylation", next: null, action: "ERK1/2 active", state: "up" }
    ],
    similarCohorts: [
      { cohort: "TCGA-SKCM-M09", similarity: 93.1, sharedGenes: "BRAF V600E+, CDKN2A loss", survivalDays: 910, citation: "TCGA NEJM 2015" }
    ],
    gaps: [
      { gap: "Targeted Therapy Resistance in Melanoma", description: "Reactivation of MAPK cascade limits Dabrafenib durability.", opportunity: "Incorporate ERK inhibitors to block bypass activation." }
    ],
    drugs: [
      { gene: "BRAF", target: "Kinase active site", drug: "Dabrafenib + Trametinib", trial: "COMBI-d study", phase: "Approved", evidence: "Strong" }
    ],
    hypothesis: {
      observation: "BRAF V600E melanoma develops early resistance to Vemurafenib.",
      mechanism: "Receptor tyrosine kinase upregulation (PDGFR-beta) bypasses RAF node.",
      prediction: "Dual inhibition of PDGFR and BRAF will suppress resistant sub-clones.",
      paperRef: "Chapman et al., Nature 2012"
    },
    causalGraph: [
      { source: "BRAF V600E mutation", target: "MEK activation", weight: 95, relation: "direct cause" },
      { source: "MEK activation", target: "Melanogenesis block", weight: 88, relation: "promotes" }
    ],
    resistanceMechanisms: {
      treatment: "Dabrafenib + Trametinib",
      mechanism: "Upregulation of receptor tyrosine kinases generates dimer signaling.",
      genes: "PDGFRB, EGFR, MAP3K8 (COT)",
      literature: "Chapman et al., Nature 2012"
    },
    drugCombinations: [
      { combo: "Dabrafenib + Trametinib", synergyScore: 92.4, trials: "COMBI-d (Phase III)", toxicity: "Pyrexia, fatigue" }
    ],
    singleCellClusters: [
      { name: "Melanocytes", markerGenes: "PMEL, TYR, BRAF", proportion: 48, communication: "Proliferate vertically through dermal layers." }
    ],
    spatialTissueData: [
      { x: 1, y: 1, cellType: "Epidermal Junction", expression: 0.2 },
      { x: 2, y: 2, cellType: "Dermal Infiltrate", expression: 3.9 }
    ],
    tumorBoard: [
      { role: "Oncologist", expert: "Dr. P. Chapman", comment: "The patient's stage III melanoma harbors the BRAF V600E mutation. We should start targeted therapy." }
    ],
    longitudinalVisits: [
      { visit: "Visit 1", mriSize: "1.8cm lesion thickness", mutations: "BRAF V600E", trajectory: "Initiated targeted therapy" }
    ],
    modelGovernance: {
      model: "NeuroGen-Melanoma-v1",
      datasetSize: "1,400 patients (TCGA-SKCM)",
      approvalStatus: "CE Marked",
      biasScore: 0.04
    }
  },
  ovarian: {
    name: "High-Grade Serous Ovarian Carcinoma (HGSOC)",
    category: "Oncology",
    baseConfidence: 94,
    defaultOmics: ["DNA", "RNA", "Clinical Data"],
    progressions: [
      { stage: "Normal Fallopian Tube", description: "Healthy secretory cells in distal fallopian tube fimbriae.", duration: "Baseline" }
    ],
    xaiFactors: [
      { factor: "TP53 Clonal Mutation (99%)", weight: 52, desc: "Found ubiquitous somatic TP53 missense/nonsense mutation in all tumor sub-clones." },
      { factor: "BRCA1 Frameshift Deletion", weight: 28, desc: "Exon 11 frameshift variant causing Homologous Recombination Deficiency (HRD)." }
    ],
    discoveredGenes: [
      {
        symbol: "BRCA1",
        chromosome: "17",
        proteinName: "Breast Cancer Type 1 Susceptibility Protein",
        function: "Coordinates double-strand DNA break homologous recombination repair.",
        mutationTypes: "Frameshift insertions/deletions, nonsense mutations.",
        variants: "185delAG, C61G",
        brainCancerRole: "Loss of BRCA1 drives extreme genomic instability and PARP inhibitor sensitivity.",
        pathways: "Homologous Recombination Repair, p53 Signaling",
        drugTargets: "Olaparib, Rucaparib, Niraparib",
        proteinLength: 1863,
        clinicalImportance: "Confirms Homologous Recombination Deficiency (HRD).",
        structure: {
          domains: ["N-terminal RING domain", "BRCT tandem repeats"],
          activeSites: ["Zinc-finger binding residues (Cys61)"]
        },
        papers: [
          { title: "Olaparib maintenance in advanced ovarian cancer", journal: "NEJM", year: 2018, citation: "Moore et al., 2018" }
        ]
      }
    ],
    biomarkers: [
      { marker: "BRCA1/2 Mutation Status", significance: "Predictive Biomarker", confidence: 96, grade: "Strong", rationale: "Germline/somatic BRCA mutations predict high sensitivity to clinical PARP inhibitors." }
    ],
    pathways: [
      { node: "BRCA1 Loss", next: "HRR Pathway Failure", action: "Failure to repair DSBs", state: "down" },
      { node: "HRR Pathway Failure", next: null, action: "CDK12 alteration active", state: "up" }
    ],
    similarCohorts: [
      { cohort: "TCGA-OV-H90", similarity: 94.2, sharedGenes: "TP53 mutant, BRCA1 deleted, HRD positive", survivalDays: 1300, citation: "TCGA Nature 2011" }
    ],
    gaps: [
      { gap: "PARP Inhibitor Resistance", description: "Secondary somatic reversion mutations in BRCA1 restore the reading frame.", opportunity: "Test combinations of PARP inhibitors with ATR or WEE1 inhibitors." }
    ],
    drugs: [
      { gene: "BRCA1", target: "BRCT binding site", drug: "Olaparib", trial: "SOLO-1 trial", phase: "Approved", evidence: "Strong" }
    ],
    hypothesis: {
      observation: "HRD-positive ovarian cancer is highly sensitive to platinum-based chemotherapy.",
      mechanism: "Inability to repair inter-strand crosslinks triggers cell death.",
      prediction: "Sequential maintenance using Niraparib will extend progression-free survival.",
      paperRef: "Moore et al., NEJM 2018"
    },
    causalGraph: [
      { source: "BRCA1 somatic deletion", target: "Homologous recombination failure", weight: 93, relation: "direct cause" },
      { source: "Homologous recombination failure", target: "Olaparib synthetic lethality", weight: 89, relation: "promotes" }
    ],
    resistanceMechanisms: {
      treatment: "Olaparib",
      mechanism: "Reversion mutations in BRCA1/2 restore wild-type reading frame.",
      genes: "BRCA1 reversion, 53BP1 loss",
      literature: "Moore et al., NEJM 2018"
    },
    drugCombinations: [
      { combo: "Olaparib + Cediranib", synergyScore: 84.2, trials: "GY004 study (Phase III)", toxicity: "Hypertension, fatigue" }
    ],
    singleCellClusters: [
      { name: "Secretory Epithelial Cells", markerGenes: "PAX8, OGP", proportion: 34, communication: "Acquire p53 signatures in fallopian tube fimbriae." }
    ],
    spatialTissueData: [
      { x: 1, y: 1, cellType: "Peritoneal Stroma", expression: 0.1 },
      { x: 2, y: 2, cellType: "STIC Nodule Core", expression: 4.1 }
    ],
    tumorBoard: [
      { role: "Oncologist", expert: "Dr. K. Moore", comment: "Following platinum chemotherapy, we must initiate Olaparib maintenance." }
    ],
    longitudinalVisits: [
      { visit: "Visit 1", mriSize: "4.8cm pelvic mass", mutations: "TP53, BRCA1 mutant", trajectory: "Platinum therapy planned" }
    ],
    modelGovernance: {
      model: "NeuroGen-Ovarian-v1",
      datasetSize: "1,500 patients (TCGA-OV)",
      approvalStatus: "CE Marked",
      biasScore: 0.05
    }
  },
  alzheimers: {
    name: "Alzheimer's Disease (Late-Onset Dementia)",
    category: "Neurology",
    baseConfidence: 91,
    defaultOmics: ["DNA", "MRI", "Clinical Data"],
    progressions: [
      { stage: "Cognitively Normal", description: "Healthy synaptic transmission with normal amyloid beta clearance.", duration: "Baseline" },
      { stage: "Asymptomatic Amyloidosis", description: "Aggregation of soluble amyloid-beta into extracellular plaques.", duration: "10-20 Years" }
    ],
    xaiFactors: [
      { factor: "APOE ε4/ε4 Homozygosity", weight: 38, desc: "Genomic profiling identified double copies of APOE4 allele, increasing risk 12-fold." },
      { factor: "MRI Hippocampal Volume Reduction", weight: 26, desc: "Significant volumetric atrophy in bilateral medial temporal lobes." }
    ],
    discoveredGenes: [
      {
        symbol: "APOE",
        chromosome: "19",
        proteinName: "Apolipoprotein E",
        function: "Lipid transport protein regulating cholesterol homeostasis and amyloid clearance.",
        mutationTypes: "APOE ε4 allele (Arg112 and Arg158 variant state).",
        variants: "ε2, ε3, ε4",
        brainCancerRole: "APOE4 isoform binds amyloid beta less efficiently, accelerating plaque deposition.",
        pathways: "Lipid metabolism, Amyloid clearance",
        drugTargets: "Lecanemab, Donanemab",
        proteinLength: 317,
        clinicalImportance: "Genomic risk factor that impacts rate of amyloid clearance.",
        structure: {
          domains: ["N-terminal Receptor Binding Domain", "C-terminal Lipid Binding Domain"],
          activeSites: ["LDLR Binding Region (residues 136-150)"]
        },
        papers: [
          { title: "APOE4 and Alzheimer's: pathobiology and therapy", journal: "Nature Reviews Neurology", year: 2021, citation: "Yamazaki et al., 2021" }
        ]
      }
    ],
    biomarkers: [
      { marker: "Cerebrospinal Fluid p-Tau181", significance: "Prognostic Biomarker", confidence: 93, grade: "Strong", rationale: "Elevated p-Tau indicates progressive tauopathy and correlates with cognitive decline rate." }
    ],
    pathways: [
      { node: "APOE ε4 Expression", next: "BACE1 Proteolysis", action: "Impaired lipid signaling", state: "normal" },
      { node: "BACE1 Proteolysis", next: null, action: "Amyloid oligomers form", state: "up" }
    ],
    similarCohorts: [
      { cohort: "ADNI-AD-APOE4-09", similarity: 89.9, sharedGenes: "APOE ε4 homozygote, p-Tau high", survivalDays: 2800, citation: "ADNI Neurology 2017" }
    ],
    gaps: [
      { gap: "A-beta plaque removal vs cognitive recovery", description: "Monoclonal antibodies clear plaques but yield modest cognitive stabilization.", opportunity: "Target early microglial activation or tau oligomer propagation." }
    ],
    drugs: [
      { gene: "APOE", target: "Amyloid Clearance", drug: "Lecanemab", trial: "Clarity AD", phase: "FDA Approved", evidence: "Moderate" }
    ],
    hypothesis: {
      observation: "Amyloid-beta clearance is enhanced by APOE3 but blocked by APOE4.",
      mechanism: "APOE4 disrupts astrocytes' lysosomal degradation pathways.",
      prediction: "Structure correctors converting APOE4 to APOE3 shape will restore clearance.",
      paperRef: "Huang et al., Nature Medicine 2018"
    },
    causalGraph: [
      { source: "APOE ε4 Homozygosity", target: "Amyloid Plaque Accumulation", weight: 90, relation: "risk factor" },
      { source: "Amyloid Plaque Accumulation", target: "Tau Hyperphosphorylation", weight: 84, relation: "promotes" }
    ],
    resistanceMechanisms: {
      treatment: "Lecanemab",
      mechanism: "Severe Cerebral Amyloid Angiopathy (CAA) increases ARIA risks.",
      genes: "APOE ε4 copy status",
      literature: "Reiman et al., Brain 2022"
    },
    drugCombinations: [
      { combo: "Lecanemab + BACE1 inhibitor", synergyScore: 78.4, trials: "NCT03901021 (preclinical)", toxicity: "Risk of cognitive worsening at high doses" }
    ],
    singleCellClusters: [
      { name: "Disease-Associated Microglia", markerGenes: "TREM2, TYROBP, APOE", proportion: 16, communication: "Initial clearing, later promoting inflammation." }
    ],
    spatialTissueData: [
      { x: 1, y: 1, cellType: "Neuron Core", expression: 1.2 },
      { x: 2, y: 2, cellType: "Plaque Margin", expression: 3.9 }
    ],
    tumorBoard: [
      { role: "Oncologist", expert: "Dr. K. Reiman", comment: "We must confirm APOE status before starting Donanemab." }
    ],
    longitudinalVisits: [
      { visit: "Baseline", mriSize: "Hippocampal volume normal", mutations: "APOE ε4/ε4", trajectory: "At-Risk" }
    ],
    modelGovernance: {
      model: "NeuroGen-Alz-Risk-v1",
      datasetSize: "800 patients (ADNI)",
      approvalStatus: "CE Marked",
      biasScore: 0.08
    }
  },
  parkinsons: {
    name: "Parkinson's Disease (Idiopathic)",
    category: "Neurology",
    baseConfidence: 90,
    defaultOmics: ["DNA", "Clinical Data"],
    progressions: [
      { stage: "Prodromal", description: "REM sleep disorder and anosmia. Minimal motor pathology.", duration: "5-15 Years" }
    ],
    xaiFactors: [
      { factor: "LRRK2 G2019S Mutation", weight: 36, desc: "Identified G2019S coding variant in the kinase domain of LRRK2." },
      { factor: "Clinical UPDRS Part III Score (34)", weight: 30, desc: "Significant resting tremor and cogwheel rigidity." }
    ],
    discoveredGenes: [
      {
        symbol: "LRRK2",
        chromosome: "12",
        proteinName: "Leucine-Rich Repeat Kinase 2",
        function: "Kinase regulating vesicle trafficking, autophagy, and lysosomal clearance.",
        mutationTypes: "G2019S coding mutation, causing kinase hyperactivation.",
        variants: "G2019S, R1441C",
        brainCancerRole: "G2019S causes increased auto-phosphorylation and vesicular decay.",
        pathways: "Autophagy, vesicular transport",
        drugTargets: "LRRK2 Inhibitors (BIIB122)",
        proteinLength: 2527,
        clinicalImportance: "Target for experimental LRRK2 kinase inhibitor studies.",
        structure: {
          domains: ["ROC GTPase Domain", "Kinase Catalytic Domain"],
          activeSites: ["Kinase ATP binding pocket (Gly2019 hotspot)"]
        },
        papers: [
          { title: "LRRK2 mutations in familial Parkinson's disease", journal: "Lancet", year: 2004, citation: "Paisan-Ruiz et al., 2004" }
        ]
      }
    ],
    biomarkers: [
      { marker: "CSF Alpha-Synuclein Aggregates", significance: "Diagnostic Biomarker", confidence: 96, grade: "Strong", rationale: "Alpha-synuclein seed amplification assays confirm misfolded protein aggregation." }
    ],
    pathways: [
      { node: "LRRK2 G2019S", next: "Lysosome Dysfunction", action: "Kinase hyperactivation", state: "up" },
      { node: "Lysosome Dysfunction", next: null, action: "α-Synuclein accumulates", state: "down" }
    ],
    similarCohorts: [
      { cohort: "PPMI-PD-58291", similarity: 92.1, sharedGenes: "LRRK2 G2019S+, GBA wild-type", survivalDays: 4500, citation: "PPMI Lancet Neurol 2022" }
    ],
    gaps: [
      { gap: "Alpha-synuclein clearing therapies fail in trials", description: "Antibodies clear plaques but fail to halt clinical progression.", opportunity: "Target intracellular oligomers." }
    ],
    drugs: [
      { gene: "LRRK2", target: "Kinase Domain", drug: "BIIB122", trial: "NCT05411120", phase: "Phase II", evidence: "Moderate" }
    ],
    hypothesis: {
      observation: "G2019S mutation hyperactivates LRRK2 kinase activity.",
      mechanism: "Phosphorylation of Rab GTPases interferes with vesicle docking.",
      prediction: "Selective LRRK2 kinase inhibition will reduce alpha-synuclein accumulation.",
      paperRef: "Alessi et al., Biochemical Journal 2018"
    },
    causalGraph: [
      { source: "LRRK2 G2019S", target: "Rab Phosphorylation", weight: 91, relation: "direct cause" },
      { source: "Rab Phosphorylation", target: "Vesicle Transport Block", weight: 85, relation: "disrupts" }
    ],
    resistanceMechanisms: {
      treatment: "Levodopa",
      mechanism: "Long-term levodopa therapy triggers down-regulation of postsynaptic dopamine receptors.",
      genes: "DRD2, COMT",
      literature: "Calabresi et al., Lancet Neurology 2015"
    },
    drugCombinations: [
      { combo: "Levodopa + Entacapone", synergyScore: 88.2, trials: "Standard Clinical Care", toxicity: "Increased risk of dyskinesias" }
    ],
    singleCellClusters: [
      { name: "Dopaminergic Neurons", markerGenes: "TH, SLC6A3 (DAT)", proportion: 8, communication: "Severely depleted in substantia nigra." }
    ],
    spatialTissueData: [
      { x: 1, y: 1, cellType: "Substantia Nigra", expression: 0.4 }
    ],
    tumorBoard: [
      { role: "Oncologist", expert: "Dr. P. Alessi", comment: "The asymmetric DaTscan putamen deficit confirms motor findings." }
    ],
    longitudinalVisits: [
      { visit: "Visit 1", mriSize: "DaTscan putamen asymmetric", mutations: "LRRK2 G2019S", trajectory: "Initiating dopaminergic therapy" }
    ],
    modelGovernance: {
      model: "NeuroGen-PD-DaT-v2",
      datasetSize: "1,200 patients (PPMI)",
      approvalStatus: "Validated - FDA Cleared",
      biasScore: 0.06
    }
  }
};

export default function DiseaseIntelligence({ user, token, projectId }: { user: any; token: string | null; projectId: any }) {
  const [selectedDisease, setSelectedDisease] = useState<DiseaseKey>("brain");
  const [selectedOmics, setSelectedOmics] = useState<string[]>(DISEASES.brain.defaultOmics);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // 4 Core Engines layout sub-tab state
  const [activeEngine, setActiveEngine] = useState<"data" | "bio" | "ml" | "ai" | "report">("data");

  // Selection states
  const [selectedGeneIndex, setSelectedGeneIndex] = useState(0);
  const [selectedProteinSite, setSelectedProteinSite] = useState<string | null>(null);

  // Digital notebook state
  const [labNotebook, setLabNotebook] = useState<{ id: number; date: string; content: string; tag: string }[]>([
    { id: 1, date: "2026-07-15", content: "Extracted DNA/RNA profiles. Sample concentrations within acceptable tolerances.", tag: "Protocol" },
    { id: 2, date: "2026-07-16", content: "MRI DICOM slice T1ce aligned. Contrast volume confirmed.", tag: "Radiology" }
  ]);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteTag, setNewNoteTag] = useState("Result");

  // AI Copilot state
  const [copilotMessages, setCopilotMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "I am the Disease Intelligence Copilot. Ask me to formulate a research hypothesis or explain gene-pathway signaling cascade." }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Autonomous Agent logs
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  // Pathway Simulator animation states
  const [pathwayStep, setPathwayStep] = useState(0);
  const [isPathwayAnimating, setIsPathwayAnimating] = useState(false);

  // Causal AI simulation variables
  const [causalIntervention, setCausalIntervention] = useState<boolean>(false);

  // Spatial Transcriptomics coordinate select
  const [selectedSpatialSpot, setSelectedSpatialSpot] = useState<{ x: number; y: number } | null>(null);

  // Paper-to-pipeline converter states
  const [paperFile, setPaperFile] = useState<string | null>(null);
  const [isConvertingPaper, setIsConvertingPaper] = useState(false);
  const [convertedWorkflow, setConvertedWorkflow] = useState<any | null>(null);

  // Digital Twin treatment option simulation
  const [twinTreatment, setTwinTreatment] = useState<string>("Control");

  // AI Reviewer / Auditor States
  const [auditChecked, setAuditChecked] = useState(false);
  const [auditIssues, setAuditIssues] = useState<{ type: string; severity: "critical" | "warning" | "info"; message: string }[]>([]);

  // Report Compiled Modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Interactive Visualization selections
  const [hoveredVolcanoGene, setHoveredVolcanoGene] = useState<string | null>(null);
  const [hoveredLollipopResidue, setHoveredLollipopResidue] = useState<number | null>(null);

  // AutoML parameters
  const [autoMlTarget, setAutoMlTarget] = useState<string>("Survival_Days");
  const [isAutoMlTraining, setIsAutoMlTraining] = useState(false);
  const [autoMlComplete, setAutoMlComplete] = useState(false);

  // Workflow Scheduler configurations
  const [scheduleFreq, setScheduleFreq] = useState<string>("Weekly");
  const [schedulerLogs, setSchedulerLogs] = useState<string[]>([
    "[Scheduler] Next cohort query scheduled for Monday at 00:00 UTC."
  ]);

  // Model serving latency monitor
  const [inferenceLatency, setInferenceLatency] = useState<number>(45); // ms

  // Dataset Versioning states
  const [datasetFiles, setDatasetFiles] = useState([
    { filename: "patient_tumor_WGS.vcf", size: "84.2 MB", hash: "sha256-a9f3b1...", version: "v1.0.1", qcStatus: "Passed" },
    { filename: "patient_mri_T1ce.nii.gz", size: "124.5 MB", hash: "sha256-e3d8f9...", version: "v1.0.0", qcStatus: "Passed" }
  ]);

  const disease = DISEASES[selectedDisease];

  // Sync default options when disease changes
  useEffect(() => {
    setSelectedOmics(DISEASES[selectedDisease].defaultOmics);
    setShowResults(false);
    setProgress(0);
    setSelectedGeneIndex(0);
    setPathwayStep(0);
    setSelectedProteinSite(null);
    setAuditChecked(false);
    setSelectedSpatialSpot(null);
    setPaperFile(null);
    setConvertedWorkflow(null);
    setAutoMlComplete(false);
  }, [selectedDisease]);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          setShowResults(true);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleToggleOmics = (layer: string) => {
    if (selectedOmics.includes(layer)) {
      setSelectedOmics(selectedOmics.filter((o) => o !== layer));
    } else {
      setSelectedOmics([...selectedOmics, layer]);
    }
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      content: newNoteText,
      tag: newNoteTag
    };
    setLabNotebook([...labNotebook, newEntry]);
    setNewNoteText("");
  };

  // Run Autonomous Agent Simulation
  const handleStartAgent = () => {
    setIsAgentRunning(true);
    setAgentLogs([]);

    const steps = [
      "Initializing Autonomous Research Agent...",
      `Querying PubMed and clinical portals for ${disease.name} biomarkers...`,
      "Executing pipeline routines and retrieving model metrics...",
      "Autonomous Research Agent run complete. Compiled Draft Report generated."
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setAgentLogs((prev) => [...prev, `[Agent] ${steps[current]}`]);
        current++;
      } else {
        clearInterval(interval);
        setIsAgentRunning(false);
      }
    }, 1200);
  };

  // Paper to pipeline mock parser
  const handlePaperConvert = () => {
    setIsConvertingPaper(true);
    setTimeout(() => {
      setConvertedWorkflow({
        paperName: "Multi-omic Landscape of Disease.pdf",
        pipeline: "NeuroGen Somatic Variant Annotator",
        parameters: {
          aligner: "BWA-MEM (v0.7.17)",
          refAssembly: "hg38 (GRCh38)"
        }
      });
      setIsConvertingPaper(false);
    }, 1500);
  };

  const handleRunAudit = () => {
    const issues: typeof auditIssues = [];
    if (!selectedOmics.includes("Clinical Data")) {
      issues.push({ type: "Clinical Profile", severity: "critical", message: "Patient demographic data or age records are missing from multi-omics matrix." });
    }
    if (!selectedOmics.includes("DNA") && !selectedOmics.includes("RNA")) {
      issues.push({ type: "Sequence Verification", severity: "warning", message: "Genomic sequence missing. Pathogenicity scoring is running on simulated baseline." });
    }
    issues.push({ type: "Statistical Audit", severity: "info", message: "Multiple testing corrections (BH) applied. FDR adjusted threshold: q < 0.05." });
    setAuditIssues(issues);
    setAuditChecked(true);
  };

  const handleRunAutoMl = () => {
    setIsAutoMlTraining(true);
    setTimeout(() => {
      setIsAutoMlTraining(false);
      setAutoMlComplete(true);
    }, 2000);
  };

  const handleCopilotSend = () => {
    if (!copilotInput.trim()) return;
    const userMsg = copilotInput;
    setCopilotMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setCopilotInput("");
    setCopilotLoading(true);

    setTimeout(() => {
      let responseText = "";
      const query = userMsg.toLowerCase();

      if (query.includes("genes") || query.includes("mutation")) {
        const geneNames = disease.discoveredGenes.map((g) => g.symbol).join(", ");
        responseText = `The engine suggests variants affecting **${geneNames}**. These could represent potential checkpoints for ${disease.name} that require further validation.`;
      } else if (query.includes("hypothesis") || query.includes("generate")) {
        responseText = `**AI Research Hypothesis Proposal (Simulated):**\n\n* **Observation:** ${disease.hypothesis.observation}\n* **Mechanism:** ${disease.hypothesis.mechanism}\n* **Prediction:** ${disease.hypothesis.prediction}\n* **Primary Literature Reference:** *${disease.hypothesis.paperRef}*`;
      } else {
        responseText = `Based on the active ${selectedOmics.join(", ")} layers, it may be beneficial to evaluate downstream signaling cascades. Let me know if you would like me to draft a workflow file.`;
      }

      setCopilotMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
      setCopilotLoading(false);
    }, 1000);
  };

  const calculateDynamicConfidence = () => {
    const omicsModifier = selectedOmics.length * 1.5;
    return Math.min(99.9, disease.baseConfidence + omicsModifier - 4.5);
  };

  const activeGene = disease.discoveredGenes[selectedGeneIndex] || disease.discoveredGenes[0];

  return (
    <div className="flex flex-col gap-6 w-full text-gray-200">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-outfit font-extrabold text-2xl text-white flex items-center gap-2.5">
            <Brain className="w-7 h-7 text-brand-teal" />
            AI Disease Intelligence Platform <span className="text-[10px] bg-brand-purple/20 text-brand-purple px-2 py-0.5 rounded-full border border-brand-purple/35">v6.0 Production</span>
          </h2>
          <p className="text-gray-400 text-xs font-light mt-0.5">
            Decoupled 4-Engine Analytics Suite integrating version-controlled datasets and ML model registries.
          </p>
        </div>

        {/* Disease focus selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Disease Focus:</label>
          <select
            value={selectedDisease}
            onChange={(e) => setSelectedDisease(e.target.value as DiseaseKey)}
            className="glass-input text-xs py-1.5 px-3 border border-gray-800"
          >
            <option value="brain">Brain Cancer (GBM)</option>
            <option value="lung">Lung Cancer (LUAD)</option>
            <option value="breast">Breast Cancer (HER2+)</option>
            <option value="liver">Liver Cancer (HCC)</option>
            <option value="colon">Colon Cancer (CRC)</option>
            <option value="leukemia">Leukemia (AML)</option>
            <option value="melanoma">Melanoma</option>
            <option value="ovarian">Ovarian Cancer (HGSOC)</option>
            <option value="alzheimers">Alzheimer's Disease</option>
            <option value="parkinsons">Parkinson's Disease</option>
          </select>
        </div>
      </div>

      {/* Multi-Omics Setup Controls */}
      <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4 bg-brand-card">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-brand-teal" />
          <h3 className="font-bold text-sm text-white">Select Omics Dimensions for Diagnostic Fusion</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {["DNA", "RNA", "Protein", "Metabolomics", "Epigenetics", "MRI", "Clinical Data"].map((layer) => {
            const active = selectedOmics.includes(layer);
            return (
              <button
                key={layer}
                onClick={() => handleToggleOmics(layer)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
                  active
                    ? "bg-brand-teal/15 text-brand-teal border-brand-teal"
                    : "bg-slate-950/40 border-gray-800 text-gray-500 hover:text-white"
                }`}
              >
                {active && <Check className="w-3.5 h-3.5" />}
                {layer}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-2 pt-4 border-t border-t-gray-850">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-purple" />
            Integrative layers: <strong className="text-white">{selectedOmics.join(" + ")}</strong>
          </div>
          
          <button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing || selectedOmics.length === 0}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-purple text-white text-sm font-bold shadow-lg shadow-brand-teal/10 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isAnalyzing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing Multimodal Embeddings ({progress}%)
              </>
            ) : (
              <>
                <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                Initialize Disease Intelligence Engine
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Board */}
      {showResults && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* 4 Engines sub tabs navigation */}
          <div className="flex border-b border-gray-800 pb-px overflow-x-auto">
            {[
              { id: "data", label: "📂 Data Intelligence Engine" },
              { id: "bio", label: "🧬 Bioinformatics Engine" },
              { id: "ml", label: "⚙️ Machine Learning Engine" },
              { id: "ai", label: "🧠 AI Intelligence Engine" },
              { id: "report", label: "📋 Downstream Report Engine" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveEngine(tab.id as any)}
                className={`px-5 py-3 border-b-2 text-sm font-semibold transition whitespace-nowrap ${
                  activeEngine === tab.id
                    ? "border-brand-teal text-brand-teal"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ENGINE 1: DATA INTELLIGENCE ENGINE */}
          {activeEngine === "data" && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              
              {/* Dataset Registry with hashes */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-brand-teal" />
                    Version-Controlled Dataset Registry (Data Lineage)
                  </h4>
                  <p className="text-gray-400 text-xs font-light">Every uploaded dataset generates a cryptographically signed signature hash for lineage tracking.</p>

                  <div className="flex flex-col gap-3">
                    {datasetFiles.map((file, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/40 border border-gray-850 rounded-xl flex justify-between items-center text-xs">
                        <div className="flex flex-col gap-0.5">
                          <strong className="text-white font-mono">{file.filename}</strong>
                          <span className="text-[10px] text-gray-500">Size: {file.size} • Hash: <span className="font-mono text-gray-400">{file.hash}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-brand-teal/15 text-brand-teal text-[9px] font-bold">
                            {file.version}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-brand-emerald/15 text-brand-emerald text-[9px] font-bold">
                            {file.qcStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Collaboration list */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-purple" />
                    Team Collaboration & RBAC Access Logs
                  </h4>
                  <div className="flex flex-col gap-2">
                    {[
                      { name: "Dr. Nagarjuna N", role: "Project Owner", permission: "Full Write", time: "Active Now" },
                      { name: "Prof. Sarah Jenkins", role: "Supervising Researcher", permission: "Read & Audit", time: "2 hours ago" }
                    ].map((member, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-950/40 border border-gray-900 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-white">{member.name}</strong>
                          <span className="text-[10px] text-gray-500 block">{member.role}</span>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded bg-brand-purple/15 text-brand-purple text-[9px] font-bold block w-fit ml-auto">
                            {member.permission}
                          </span>
                          <span className="text-[9px] text-gray-600 italic block mt-0.5">{member.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chunk Upload simulator */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4 bg-brand-card">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <UploadCloud className="w-4.5 h-4.5 text-brand-teal" />
                    Dataset Chunk Upload portal
                  </h4>
                  <div className="p-5 border border-dashed border-gray-800 rounded-xl text-center flex flex-col gap-2 bg-slate-950/30">
                    <span className="text-xs text-gray-400">Supports BAM, VCF, NIfTI, DICOM up to 25GB.</span>
                    <button onClick={() => alert("Simulating chunk upload sequence...")} className="text-brand-teal text-[11px] font-bold hover:underline">
                      Upload Sample Dataset Chunk
                    </button>
                  </div>
                </div>

                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-brand-teal" />
                    Federated Learning Console
                  </h4>
                  <div className="flex justify-between items-center p-2.5 bg-slate-950/40 border border-gray-900 rounded-xl text-xs">
                    <div>
                      <strong className="text-white">Mayo Clinic + MD Anderson</strong>
                      <span className="text-[10px] text-gray-500 block">Parameter sync: Connected</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-brand-emerald/15 text-brand-emerald text-[9px] font-bold">
                      Online
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ENGINE 2: BIOINFORMATICS ENGINE */}
          {activeEngine === "bio" && (
            <div className="grid lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Column: Volcano, Lollipop, and Genes */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Volcano Plot Card */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-white">Differential Gene Expression Volcano Plot</h4>
                      <p className="text-gray-400 text-[11px] font-light">Hover points to see Fold Change and significance values.</p>
                    </div>
                    {hoveredVolcanoGene && (
                      <span className="px-2 py-0.5 rounded bg-brand-teal/15 text-brand-teal border border-brand-teal/35 text-xs font-mono">
                        {hoveredVolcanoGene}
                      </span>
                    )}
                  </div>

                  {/* SVG Volcano Plot */}
                  <div className="bg-slate-950/80 p-4 border border-gray-900 rounded-xl flex justify-center py-6">
                    <svg className="w-[85%] h-40" viewBox="0 0 100 50">
                      <line x1="50" y1="0" x2="50" y2="50" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="1 1" />
                      <line x1="0" y1="40" x2="100" y2="40" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="1 1" />
                      
                      <circle cx="20" cy="15" r="2.5" fill="#3b82f6" className="cursor-pointer hover:scale-125 transition"
                              onMouseEnter={() => setHoveredVolcanoGene("PTEN (log2FC: -2.2, p: 1.2e-6)")}
                              onMouseLeave={() => setHoveredVolcanoGene(null)} />
                      <circle cx="80" cy="10" r="2.5" fill="#ef4444" className="cursor-pointer hover:scale-125 transition"
                              onMouseEnter={() => setHoveredVolcanoGene("EGFR (log2FC: 3.4, p: 3.5e-8)")}
                              onMouseLeave={() => setHoveredVolcanoGene(null)} />
                      <circle cx="48" cy="38" r="2" fill="#9ca3af" />
                    </svg>
                  </div>
                </div>

                {/* Lollipop mutation Explorer */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-white">Variant Mutation Lollipop Chart</h4>
                      <p className="text-gray-400 text-[11px] font-light">Residue coordinate somatic variant mutation frequency.</p>
                    </div>
                    {hoveredLollipopResidue && (
                      <span className="px-2 py-0.5 rounded bg-brand-purple/15 text-brand-purple border border-brand-purple/35 text-xs font-mono">
                        Residue: Val{hoveredLollipopResidue}
                      </span>
                    )}
                  </div>

                  {/* SVG Lollipop Plot */}
                  <div className="bg-slate-950/80 p-4 border border-gray-900 rounded-xl flex justify-center py-4">
                    <svg className="w-[90%] h-24" viewBox="0 0 100 30">
                      <line x1="5" y1="25" x2="95" y2="25" stroke="#4b5563" strokeWidth="2" />
                      
                      <line x1="25" y1="25" x2="25" y2="10" stroke="#8b5cf6" strokeWidth="1" />
                      <circle cx="25" cy="10" r="2.5" fill="#8b5cf6" className="cursor-pointer hover:scale-125 transition"
                              onMouseEnter={() => setHoveredLollipopResidue(112)}
                              onMouseLeave={() => setHoveredLollipopResidue(null)} />

                      <line x1="58" y1="25" x2="58" y2="5" stroke="#d946ef" strokeWidth="1" />
                      <circle cx="58" cy="5" r="2.5" fill="#d946ef" className="cursor-pointer hover:scale-125 transition"
                              onMouseEnter={() => setHoveredLollipopResidue(600)}
                              onMouseLeave={() => setHoveredLollipopResidue(null)} />
                    </svg>
                  </div>
                </div>

              </div>

              {/* Right Column: Single-cell & spatial coordinate spots */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Single cell clusters */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4 bg-brand-card">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-brand-teal" />
                    Single-Cell Transcriptomics (scRNA-seq)
                  </h4>
                  <div className="flex flex-col gap-3">
                    {disease.singleCellClusters?.map((cluster, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/40 border border-gray-900 rounded-xl flex flex-col gap-1 text-xs">
                        <div className="flex justify-between items-center">
                          <strong className="text-white font-medium">{cluster.name}</strong>
                          <span className="text-brand-teal font-bold">{cluster.proportion}%</span>
                        </div>
                        <div className="text-[10px] text-gray-500">Marker genes: <strong className="text-gray-400 font-mono">{cluster.markerGenes}</strong></div>
                      </div>
                    )) || (
                      <div className="text-gray-500 italic text-center py-2">Single-cell details pending dataset annotation.</div>
                    )}
                  </div>
                </div>

                {/* Spatial transcriptomics overlay */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <h4 className="font-bold text-sm text-white">Spatial Transcriptomics tissue Viewer</h4>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-4 border border-gray-900 rounded-xl justify-items-center">
                    {disease.spatialTissueData?.map((spot, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSpatialSpot({ x: spot.x, y: spot.y })}
                        className={`w-full py-3 border rounded-xl flex flex-col items-center justify-center transition ${
                          selectedSpatialSpot?.x === spot.x && selectedSpatialSpot?.y === spot.y
                            ? "bg-brand-teal/20 border-brand-teal text-white"
                            : "bg-slate-900 border-gray-855 text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="text-[10px] font-bold font-mono">Spot [{spot.x},{spot.y}]</span>
                        <span className="text-[9px] text-gray-500 font-light mt-0.5">{spot.cellType}</span>
                      </button>
                    )) || (
                      <div className="text-gray-500 italic text-center py-2 col-span-2">Spatial tissue data unavailable.</div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ENGINE 3: MACHINE LEARNING ENGINE */}
          {activeEngine === "ml" && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Model Registry & Feature Store */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Model Registry */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-brand-teal" />
                    Model Registry & Governance
                  </h4>
                  <p className="text-gray-400 text-xs font-light">Every trained model is tracked with specific weights, datasets, accuracy logs, and random seeds.</p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-500">
                          <th className="pb-2 font-semibold">Model Name</th>
                          <th className="pb-2 font-semibold">Version</th>
                          <th className="pb-2 font-semibold">Dataset</th>
                          <th className="pb-2 font-semibold">Accuracy</th>
                          <th className="pb-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-900 text-gray-300">
                          <td className="py-2.5 font-mono">MRI-Classifier-ResNet18</td>
                          <td className="py-2.5">v1.2.0</td>
                          <td className="py-2.5 text-gray-400">BraTS 2025</td>
                          <td className="py-2.5 font-semibold text-brand-teal">94.7%</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded bg-brand-emerald/15 text-brand-emerald text-[9px] font-bold">
                              Production
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-900 text-gray-300">
                          <td className="py-2.5 font-mono">Tumor-Segmenter-UNet</td>
                          <td className="py-2.5">v2.1.0</td>
                          <td className="py-2.5 text-gray-400">BraTS 2025</td>
                          <td className="py-2.5 font-semibold text-brand-teal">91.2% (Dice)</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded bg-brand-emerald/15 text-brand-emerald text-[9px] font-bold">
                              Production
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Feature Store */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4 bg-brand-card">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-brand-purple" />
                    Feature Store (`feature_store/` Caching Layer)
                  </h4>
                  <p className="text-gray-400 text-xs font-light">Shared feature cache prevents duplicate preprocessing computations for DNA, RNA, and MRI features.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-2.5 bg-slate-950/40 border border-gray-850 rounded text-center">
                      <span className="text-[10px] text-gray-500 block">Gene Expressions</span>
                      <strong className="text-white text-[10px] block mt-0.5">Cached (1.2M rows)</strong>
                    </div>
                    <div className="p-2.5 bg-slate-950/40 border border-gray-850 rounded text-center">
                      <span className="text-[10px] text-gray-500 block">Clinical Features</span>
                      <strong className="text-white text-[10px] block mt-0.5">Cached (42 columns)</strong>
                    </div>
                    <div className="p-2.5 bg-slate-950/40 border border-gray-850 rounded text-center">
                      <span className="text-[10px] text-gray-500 block">Mutation Tensors</span>
                      <strong className="text-white text-[10px] block mt-0.5">Cached (84k mutations)</strong>
                    </div>
                    <div className="p-2.5 bg-slate-950/40 border border-gray-850 rounded text-center">
                      <span className="text-[10px] text-gray-500 block">MRI Radiomics</span>
                      <strong className="text-white text-[10px] block mt-0.5">Cached (256 vectors)</strong>
                    </div>
                  </div>
                </div>

                {/* AutoML wizard */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <h4 className="font-bold text-sm text-white">AutoML No-Code Trainer</h4>
                  <p className="text-gray-400 text-xs font-light">Select a target column to fit cross-validated model selections without code.</p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] text-gray-500 uppercase font-bold">Predictive Target:</label>
                      <select
                        value={autoMlTarget}
                        onChange={(e) => setAutoMlTarget(e.target.value)}
                        className="bg-slate-950 border border-gray-850 text-xs p-2 rounded text-white"
                      >
                        <option value="Survival_Days">Survival Days (Regression)</option>
                        <option value="Subtype">Molecular Subtype (Classification)</option>
                        <option value="Drug_Sensitivity">IC50 Drug Response (Regression)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleRunAutoMl}
                      disabled={isAutoMlTraining}
                      className="px-6 py-2.5 bg-brand-teal text-white rounded-xl text-xs font-bold hover:opacity-90 transition mt-auto disabled:opacity-40"
                    >
                      {isAutoMlTraining ? "Auto-fitting Models..." : "Fit AutoML Models"}
                    </button>
                  </div>

                  {autoMlComplete && (
                    <div className="p-3 bg-slate-950/60 border border-brand-emerald/20 rounded-xl text-xs leading-normal">
                      <strong className="text-brand-emerald block mb-1">AutoML Fit Completed (Simulated)</strong>
                      <span className="text-gray-400 font-light">
                        Fitted **XGBoost Regressor** with R² score of **0.82**. The model weights have been synced to the staging registry.
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Scheduler, Latency, and Twin */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Workflow Scheduler */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-purple" />
                    Workflow Scheduler
                  </h4>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold">Execution Frequency:</label>
                    <select
                      value={scheduleFreq}
                      onChange={(e) => {
                        setScheduleFreq(e.target.value);
                        setSchedulerLogs((prev) => [
                          ...prev,
                          `[Scheduler] Frequency changed to ${e.target.value}.`
                        ]);
                      }}
                      className="bg-slate-950 border border-gray-850 text-xs p-2 rounded text-white"
                    >
                      <option value="Daily">Daily cohort analysis</option>
                      <option value="Weekly">Weekly literature refresh</option>
                      <option value="Monthly">Monthly model retraining</option>
                    </select>
                  </div>

                  <div className="bg-slate-950/90 border border-gray-900 p-3 rounded-xl font-mono text-[10px] text-brand-purple max-h-24 overflow-y-auto">
                    {schedulerLogs.map((log, idx) => (
                      <div key={idx}>{log}</div>
                    ))}
                  </div>
                </div>

                {/* Serving Gateway Latency Monitoring */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Activity className="w-4.5 h-4.5 text-brand-teal" />
                    Serving Gateway Latency Monitor
                  </h4>
                  <div className="flex justify-between items-center bg-slate-950/40 p-3 border border-gray-900 rounded-xl text-xs">
                    <div>
                      <span className="text-gray-500 block uppercase text-[9px]">Average Inference Time</span>
                      <strong className="text-white text-lg">{inferenceLatency} ms</strong>
                    </div>
                    <button
                      onClick={() => setInferenceLatency(Math.max(10, inferenceLatency - 5))}
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-gray-850 rounded"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ENGINE 4: AI INTELLIGENCE ENGINE */}
          {activeEngine === "ai" && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Copilot conversation */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <MessageSquareText className="w-5 h-5 text-brand-teal" />
                    AI Copilot conversation (LLM/RAG Integration)
                  </h4>

                  <div className="bg-slate-950/90 border border-gray-900 p-4 rounded-xl flex flex-col gap-3 min-h-[220px] max-h-[300px] overflow-y-auto">
                    {copilotMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                          msg.role === "assistant"
                            ? "bg-slate-900 text-gray-300 mr-auto border border-gray-850"
                            : "bg-brand-teal/15 text-white ml-auto border border-brand-teal/30"
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))}
                    {copilotLoading && (
                      <div className="text-gray-500 animate-pulse text-xs">AI Copilot is generating response...</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={copilotInput}
                      onChange={(e) => setCopilotInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCopilotSend()}
                      placeholder="Ask the AI copilot about biomarkers or draft hypothesis..."
                      className="glass-input text-xs flex-1"
                    />
                    <button onClick={handleCopilotSend} className="p-3 bg-brand-teal text-white rounded-xl hover:opacity-90 transition">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Autonomous Agent console traces */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4 bg-brand-card">
                  <h4 className="font-bold text-sm text-white">Autonomous Research Agent console</h4>
                  <button
                    onClick={handleStartAgent}
                    disabled={isAgentRunning}
                    className="w-full py-2.5 bg-gradient-to-r from-brand-teal to-brand-purple text-white text-xs font-bold hover:opacity-95 transition disabled:opacity-50"
                  >
                    {isAgentRunning ? "Running Agent routines..." : "Execute Autonomous Agent Run"}
                  </button>

                  <div className="bg-slate-950/90 border border-gray-900 p-4 rounded-xl font-mono text-[10px] min-h-[120px] flex flex-col gap-1.5 overflow-y-auto max-h-[200px]">
                    {agentLogs.length === 0 ? (
                      <span className="text-gray-600 italic text-center py-4 block">Console idle. Trigger autonomous run to see logs...</span>
                    ) : (
                      agentLogs.map((log, idx) => (
                        <div key={idx} className="text-brand-teal">{log}</div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Paper-to-pipeline converter */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-purple" />
                    AI Paper-to-Pipeline Converter
                  </h4>
                  <div className="border border-dashed border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 bg-slate-950/20">
                    <UploadCloud className="w-6 h-6 text-gray-500" />
                    <button onClick={handlePaperConvert} className="text-brand-teal text-[11px] font-bold hover:underline">
                      Select Mock Research Paper
                    </button>
                  </div>

                  {convertedWorkflow && (
                    <div className="p-3 bg-slate-950/60 border border-brand-purple/20 rounded-xl text-[11px] flex flex-col gap-1.5">
                      <strong className="text-white font-medium truncate">{convertedWorkflow.paperName}</strong>
                      <div className="flex flex-col gap-0.5 text-gray-400">
                        <span>Workflow: {convertedWorkflow.pipeline}</span>
                        <span>Assembly: {convertedWorkflow.parameters.refAssembly}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: DOWNSTREAM REPORT ENGINE */}
          {activeEngine === "report" && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Reproducibility and logs */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Reproducibility certificates */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <h4 className="font-bold text-sm text-white">Reproducibility Engine</h4>
                  <p className="text-gray-400 text-xs font-light">Compiles MD5 dataset hashes, random seeds, and container tags for clinical peer-review.</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono bg-slate-950/40 p-3 border border-gray-900 rounded-xl">
                    <div className="p-2 border border-gray-850 rounded">
                      <span className="text-[10px] text-gray-500 block">Dataset Hash</span>
                      <span className="text-white text-[10px] truncate block">d84f382a9c1e7a5b3f2e4c</span>
                    </div>
                    <div className="p-2 border border-gray-850 rounded">
                      <span className="text-[10px] text-gray-500 block">Software Version</span>
                      <span className="text-white text-[10px] block">Lifelines v0.28.0</span>
                    </div>
                    <div className="p-2 border border-gray-850 rounded">
                      <span className="text-[10px] text-gray-500 block">Docker Target</span>
                      <span className="text-white text-[10px] block">sandbox-env:v6.0</span>
                    </div>
                    <div className="p-2 border border-gray-850 rounded">
                      <span className="text-[10px] text-gray-500 block">Random Seed</span>
                      <span className="text-white text-[10px] block">Seed=42</span>
                    </div>
                  </div>
                </div>

                {/* Lab Notebook */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4 bg-brand-card">
                  <h4 className="font-bold text-sm text-white">Project Digital Lab Notebook</h4>
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                    {labNotebook.map((entry) => (
                      <div key={entry.id} className="p-3 bg-slate-950/40 border border-gray-850 rounded-xl text-xs">
                        <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                          <span>Date: {entry.date}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-brand-teal/10 text-brand-teal">{entry.tag}</span>
                        </div>
                        <p className="text-gray-300 font-light">{entry.content}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 pt-3 border-t border-gray-900">
                    <input
                      type="text"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Log notebook observations..."
                      className="glass-input text-xs"
                    />
                    <button onClick={handleAddNote} className="px-4 py-2 self-end bg-slate-900 border border-gray-850 hover:border-brand-teal/40 text-brand-teal text-xs font-bold transition rounded-xl">
                      Log entry
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: AI review trigger and print modal */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* AI Reviewer Audit */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-brand-purple" />
                    AI Dataset Reviewer & Auditor
                  </h4>
                  {auditChecked ? (
                    <div className="flex flex-col gap-2.5">
                      {auditIssues.map((issue, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl border bg-slate-950/40 text-xs flex gap-2 items-start"
                             style={{ borderColor: issue.severity === "critical" ? "#ef444433" : issue.severity === "warning" ? "#f59e0b33" : "#10b98133" }}>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-white">{issue.type}</span>
                            <span className="text-[10px] text-gray-400 font-light leading-snug">{issue.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={handleRunAudit}
                      className="w-full py-2.5 bg-slate-900 border border-gray-800 hover:border-brand-teal/40 text-brand-teal text-xs font-bold transition rounded-xl"
                    >
                      Run Dataset Integrity Check
                    </button>
                  )}
                </div>

                {/* Compiled Report compile button */}
                <div className="glass-card p-6 border border-gray-850 flex flex-col gap-4 bg-brand-card">
                  <h4 className="font-bold text-sm text-white">Compile Clinical Research Report</h4>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-purple text-white text-xs font-bold hover:opacity-95 transition rounded-xl"
                  >
                    Compile & Preview PDF Report
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* REPORT COMPILER MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-950 border border-gray-800 rounded-2xl p-6 flex flex-col gap-6 max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-850 pb-4">
              <div>
                <h3 className="font-outfit font-extrabold text-xl text-white">NeuroGen AI - Compiled Disease Intelligence Report</h3>
                <p className="text-gray-500 text-xs mt-0.5">Authoritative diagnostic and multi-omics analysis output summary.</p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-white transition text-xs font-semibold"
              >
                ✕ Close Preview
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 text-xs text-gray-300 leading-relaxed font-light font-sans">
              
              <div className="grid grid-cols-2 gap-4 bg-slate-900/60 p-4 border border-gray-850 rounded-xl font-mono">
                <div>
                  <span className="text-gray-500 block uppercase text-[9px]">Target Disease Class</span>
                  <strong className="text-white">{disease.name}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[9px]">Integrated Omics Layers</span>
                  <strong className="text-white">{selectedOmics.join(", ")}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[9px]">Attributed AI Confidence</span>
                  <strong className="text-white text-brand-teal">{calculateDynamicConfidence().toFixed(2)}%</strong>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[9px]">Timestamp</span>
                  <strong className="text-white">{new Date().toISOString()}</strong>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <strong className="text-white text-sm border-b border-gray-900 pb-1 flex items-center gap-1.5 font-bold font-mono">
                  Clinical Biomarkers & Discovered Alterations
                </strong>
                <ul className="flex flex-col gap-2 pl-4 list-disc">
                  {disease.biomarkers.map((b, idx) => (
                    <li key={idx}>
                      <strong className="text-white font-semibold">{b.marker} ({b.significance})</strong> — Scored with {b.confidence}% confidence. {b.rationale}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <strong className="text-white text-sm border-b border-gray-900 pb-1 flex items-center gap-1.5 font-bold font-mono">
                  Explainable AI (XAI) Attribution Breakdown
                </strong>
                <ul className="flex flex-col gap-2 pl-4 list-disc">
                  {disease.xaiFactors.map((item, idx) => (
                    <li key={idx}>
                      <strong className="text-white font-semibold">{item.factor}</strong> contributes <strong className="text-brand-teal">+{item.weight}%</strong> to total classification confidence.
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-brand-purple/20 bg-brand-purple/5 flex gap-3 text-xs leading-relaxed text-gray-300">
                <ShieldAlert className="w-5 h-5 text-brand-purple shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1 font-light">
                  <span className="font-bold text-white">Evidence-Based Research Disclaimer</span>
                  <span>
                    All recommendations and model outputs generated represent experimental biological annotations. 
                    These calculations are compiled for clinical research assistance and molecular hypothesis generation. 
                    They do not constitute medical diagnosis or therapeutic treatment directions.
                  </span>
                </div>
              </div>

            </div>

            <div className="flex justify-between items-center border-t border-gray-850 pt-4 mt-2 font-mono">
              <span className="text-[10px] text-gray-500 font-mono">Dataset MD5: d84f382a9c1e7a5b3f2e4c</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-gray-855 text-gray-300 text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("Report compiled successfully! Initializing PDF printer download...");
                    setShowReportModal(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-brand-teal text-white text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Print / Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
