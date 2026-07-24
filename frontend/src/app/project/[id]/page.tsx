"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  Brain, ArrowLeft, HardDrive, Cpu, FileCheck, Users, MessageSquareText, 
  UploadCloud, FileText, CheckCircle2, Loader, Play, Sparkles, Send, Plus, 
  HelpCircle, BarChart3, AlertCircle, Download, Check
} from "lucide-react";

// Import dynamic visualizations
import PathwayNetwork from "../../../components/PathwayNetwork";
import DiseaseIntelligence from "../../../components/DiseaseIntelligence";
import { API_BASE_URL } from "../../../utils/api";
import { 
  QcPhredChart, 
  ExpressionVolcano, 
  ExpressionHeatmap, 
  MutationLollipop, 
  SurvivalKmChart 
} from "../../../components/PlotlyCharts";

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;
  
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("datasets");
  
  // Data lists
  const [datasets, setDatasets] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  
  // Selected visual data
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(false);
  
  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null);
  const [datasetType, setDatasetType] = useState("Genomic");
  
  // AI Chat state
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Invite team state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Collaborator");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Load Auth Credentials
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      router.push("/login");
      return;
    }

    setToken(storedToken);
    setUser(JSON.parse(storedUser));
  }, [router]);

  // Load Workspace Metadata
  useEffect(() => {
    if (!token || !projectId) return;

    const fetchWorkspaceData = async () => {
      let projData = null;
      let dsData: any[] = [];
      let allFiles: any[] = [];
      let analysisData: any[] = [];
      let repData: any[] = [];
      let memData: any[] = [];
      let chats: any[] = [];

      try {
        // Project info
        const projResp = await fetch(`${API_BASE_URL}/api/v1/projects/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (projResp.ok) {
          projData = await projResp.json();
        }

        // Datasets
        const datasetResp = await fetch(`${API_BASE_URL}/api/v1/datasets/projects/${projectId}/datasets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (datasetResp.ok) {
          dsData = await datasetResp.json();
          setDatasets(dsData);
          
          // Flatten files for display
          for (const ds of dsData) {
            const detailResp = await fetch(`${API_BASE_URL}/api/v1/datasets/datasets/${ds.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (detailResp.ok) {
              const detail = await detailResp.json();
              detail.files.forEach((f: any) => {
                allFiles.push({ ...f, dataset_name: ds.name, dataset_id: ds.id });
              });
            }
          }
        }

        // Analyses
        const analysisResp = await fetch(`${API_BASE_URL}/api/v1/analyses/projects/${projectId}/analyses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (analysisResp.ok) {
          analysisData = await analysisResp.json();
        }

        // Reports
        const reportsResp = await fetch(`${API_BASE_URL}/api/v1/reports/projects/${projectId}/reports`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (reportsResp.ok) {
          repData = await reportsResp.json();
        }

        // Members
        const memResp = await fetch(`${API_BASE_URL}/api/v1/projects/projects/${projectId}/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (memResp.ok) {
          memData = await memResp.json();
        }

        // AI Chat sessions
        const chatResp = await fetch(`${API_BASE_URL}/api/v1/ai/projects/${projectId}/chats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (chatResp.ok) {
          chats = await chatResp.json();
        }
      } catch (err) {
        console.error("Fetch details failed:", err);
      }

      setProject(projData);
      setFiles(allFiles);
      setAnalyses(analysisData);
      setReports(repData);
      setMembers(memData);
      setChatSessions(chats);

      if (chats.length > 0) {
        handleSelectChat(chats[0].id);
      } else {
        createChatSession();
      }
      setLoading(false);
    };

    fetchWorkspaceData();
  }, [token, projectId]);

  // Create Chat session
  const createChatSession = async () => {
     if (!token) return;
     try {
       const resp = await fetch(`${API_BASE_URL}/api/v1/ai/projects/${projectId}/chats`, {
          method: "POST",
          headers: {
             "Content-Type": "application/json",
             Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title: `Discussion session` })
       });
       if (resp.ok) {
          const newChat = await resp.json();
          setChatSessions(prev => [newChat, ...prev]);
          handleSelectChat(newChat.id);
       }
     } catch (e) {
        console.log("Chat session creation failed");
     }
  };

  // Select active chat session
  const handleSelectChat = async (chatId: number) => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/ai/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        const chatData = await resp.json();
        setActiveChat(chatData);
        setChatMessages(chatData.messages);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    // Demo / fallback loading
    setActiveChat({ id: chatId, title: "Molecular Discussion" });
    setChatMessages([
      { id: 1, role: "assistant", content: "Welcome to the NeuroGen AI Research workspace assistant! I can help you analyze mutations, explain pathway structures, summarize uploaded datasets, and design hypotheses. Ask me anything to get started." }
    ]);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !token) return;

    const userText = newMessage;
    const userMsgId = Date.now();
    setNewMessage("");
    setSendingMessage(true);

    // Optimistically update list
    setChatMessages(prev => [...prev, { id: userMsgId, role: "user", content: userText }]);

    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/ai/chats/${activeChat.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: userText })
      });

      if (resp.ok) {
        const reply = await resp.json();
        setChatMessages(prev => [...prev.filter(m => m.id !== userMsgId), reply]);
        setSendingMessage(false);
        return;
      }
    } catch (err) {
      console.log("AI Chat API failed, returning mock response");
    }

    // Mock replies based on queries
    let replyText = "";
    const prompt_lower = userText.toLowerCase();
    
    if (prompt_lower.includes("fundamentals") || prompt_lower.includes("what is brain cancer") || prompt_lower.includes("metastatic") || prompt_lower.includes("who grading") || prompt_lower.includes("risk factors") || prompt_lower.includes("symptoms") || prompt_lower.includes("diagnosis methods") || prompt_lower.includes("recurrence") || prompt_lower.includes("prognosis")) {
      replyText = "### Brain Cancer Fundamentals\n\nBrain cancer comprises primary tumors (originating in the brain) and metastatic tumors (spreading from other organs, e.g., lung, breast). Under the **WHO Grading System (Grades I-IV)**, tumors are classified based on malignancy, mitotic activity, and genetic profiles.\n\n* **Epidemiology**: Glioblastoma is the most common malignant primary brain tumor in adults, with an incidence rate of ~3.2 per 100,000.\n* **Risk Factors**: Ionizing radiation is the only established environmental risk factor. Genetic syndromes (e.g., Li-Fraumeni, Neurofibromatosis) predispose patients.\n* **Symptoms**: Raised intracranial pressure leads to headaches, seizures, and focal neurological deficits.\n* **Diagnosis & Treatment**: Diagnosed via contrast-enhanced MRI and biopsy. Standard treatment includes surgical resection, radiotherapy, and alkylating chemotherapy (Temozolomide).";
    } else if (prompt_lower.includes("tumor types") || prompt_lower.includes("glioblastoma") || prompt_lower.includes("gbm") || prompt_lower.includes("astrocytoma") || prompt_lower.includes("oligodendroglioma") || prompt_lower.includes("ependymoma") || prompt_lower.includes("medulloblastoma") || prompt_lower.includes("meningioma") || prompt_lower.includes("pituitary")) {
      replyText = "### Brain Tumor Types & Subclasses\n\n1. **Glioblastoma (GBM)** (WHO Grade IV): Histologically defined by microvascular proliferation and pseudopalisading necrosis. Biomarkers include EGFR amplification and TERT promoter mutations. Median survival is 12-15 months.\n2. **Astrocytoma** (WHO Grade II-IV): Characterized by IDH1/IDH2 mutations and ATRX loss. Standard treatments include surgery followed by adjuvant RT/TMZ.\n3. **Oligodendroglioma** (WHO Grade II-III): Defined by **IDH mutation and 1p/19q co-deletion**. Possesses favorable chemosensitivity and survival rates.\n4. **Ependymoma**: Arises from ependymal cells lining ventricular surfaces; commonly defined by C11orf95-RELA fusions in supratentorial cases.\n5. **Medulloblastoma**: Most common malignant pediatric brain tumor, divided into WNT, SHH, Group 3, and Group 4 molecular subgroups.\n6. **Meningioma**: Arises from meningeal layers; usually benign (Grade I) but atypical (Grade II) or anaplastic (Grade III) forms occur. Characterized by NF2 alterations.";
    } else if (prompt_lower.includes("molecular biology") || prompt_lower.includes("transcription") || prompt_lower.includes("translation") || prompt_lower.includes("cell cycle") || prompt_lower.includes("apoptosis") || prompt_lower.includes("angiogenesis") || prompt_lower.includes("microenvironment")) {
      replyText = "### Molecular Biology of Gliomagenesis\n\n* **Transcription & Translation**: Oncogenic driver loops hyperactivate protein translation networks (e.g., eIF4F complex regulation downstream of AKT).\n* **Cell Cycle Control**: Disruption of the RB pathway (via CDKN2A deletion or CDK4/6 amplification) drives uncontrolled cell division.\n* **Apoptosis Evasion**: Mediated by TP53 loss-of-function, MDM2 amplification, or overexpression of anti-apoptotic Bcl-2 family members.\n* **Angiogenesis**: Brain tumors (especially GBM) are highly vascularized. Hypoxia triggers VEGF secretion, promoting chaotic microvascular proliferation.\n* **Tumor Microenvironment (TME)**: Rich in tumor-associated macrophages (TAMs), microglia, and immunosuppressive cytokines (TGF-$\\beta$, IL-10) that shield the tumor from immunological clearance.";
    } else if (prompt_lower.includes("tp53") || prompt_lower.includes("egfr") || prompt_lower.includes("idh1") || prompt_lower.includes("idh2") || prompt_lower.includes("pten") || prompt_lower.includes("atrx") || prompt_lower.includes("mgmt") || prompt_lower.includes("tert") || prompt_lower.includes("cdkn2a") || prompt_lower.includes("cdk4") || prompt_lower.includes("braf") || prompt_lower.includes("nf1")) {
      replyText = "### Brain Cancer Genetics & Key Driver Genes\n\n* **IDH1/2**: Mutated metabolic enzymes. The IDH1 R132H mutation converts $\\alpha$-KG to the oncometabolite 2-hydroxyglutarate (2-HG), causing CpG Island Methylator Phenotype (G-CIMP).\n* **EGFR**: Amplified or mutated in 50% of GBM. EGFRvIII (deletion of exons 2-7) drives ligand-independent proliferative signals.\n* **TP53**: Tumor suppressor mutated in astrocytomas. Leads to loss of cell-cycle arrest checkpoints.\n* **PTEN**: Phosphatase that acts as a negative regulator of the PI3K pathway. Deletion or mutation is common in primary glioblastomas, driving AKT activation.\n* **ATRX**: Loss of ATRX expression is characteristic of IDH-mutant astrocytomas and leads to Alternative Lengthening of Telomeres (ALT).\n* **MGMT**: Promoter methylation silences the O6-methylguanine-DNA methyltransferase repair gene, predicting clinical response to Temozolomide (TMZ).";
    } else if (prompt_lower.includes("biomarker")) {
      replyText = "### Brain Tumor Biomarkers Classification\n\n1. **Diagnostic**: IDH1/2 mutation status and 1p/19q co-deletion status are mandatory for oligodendroglioma vs. astrocytoma classification.\n2. **Prognostic**: IDH mutation status is a strong indicator of favorable overall survival.\n3. **Predictive**: **MGMT promoter methylation** status predicts sensitivity and clinical response to Temozolomide alkylating chemotherapy.\n4. **Tissue vs. Blood (Liquid Biopsy)**: Tissue remains the gold standard, but circulating tumor DNA (ctDNA) and tumor-derived extracellular vesicles (EVs) in cerebrospinal fluid (CSF) or plasma are emerging as minimally invasive monitoring options.";
    } else if (prompt_lower.includes("omics") || prompt_lower.includes("genomics") || prompt_lower.includes("transcriptomics") || prompt_lower.includes("proteomics") || prompt_lower.includes("metabolomics") || prompt_lower.includes("epigenomics") || prompt_lower.includes("single-cell") || prompt_lower.includes("spatial transcriptomics")) {
      replyText = "### Omics Applications in Neuro-Oncology\n\n* **Genomics**: High-throughput DNA sequencing (WGS/WES) reveals somatic copy number variations, SNVs, and structural rearrangements (e.g., EGFR amplification).\n* **Transcriptomics**: RNA-Seq classifies tumors into molecular subtypes (Proneural, Classical, Mesenchymal) based on bulk expression signatures.\n* **Epigenomics**: DNA methylation arrays (e.g., EPIC 850k) are used for machine-learning-based classification of central nervous system tumors.\n* **Single-Cell & Spatial Transcriptomics**: Resolves spatial tumor heterogeneity, mapping immune-infiltrated zones versus hypoxic, necrotic tumor cores.";
    } else if (prompt_lower.includes("sequencing") || prompt_lower.includes("whole genome") || prompt_lower.includes("whole exome") || prompt_lower.includes("rna-seq") || prompt_lower.includes("microarray") || prompt_lower.includes("nanopore") || prompt_lower.includes("illumina")) {
      replyText = "### Sequencing Technologies Overview\n\n1. **Illumina sequencing**: Short-read sequencing by synthesis, offering high coverage depth and precision for variant calling (SNVs, indels).\n2. **Nanopore sequencing**: Long-read sequencing of raw DNA strands passing through membrane pores, useful for resolving structural variations, copy number changes, and methylation states directly.\n3. **RNA-Seq**: Quantifies cellular transcripts to map gene expression, splice isoforms, and fusions.\n4. **Whole Exome Sequencing (WES)**: Captures protein-coding exons (~1-2% of the genome), optimizing variant discovery and mutational burden calculations.";
    } else if (prompt_lower.includes("pipelines") || prompt_lower.includes("quality control") || prompt_lower.includes("alignment") || prompt_lower.includes("variant calling") || prompt_lower.includes("differential expression") || prompt_lower.includes("pathway analysis") || prompt_lower.includes("survival analysis")) {
      replyText = "### Bioinformatics Pipelines & Interpretations\n\n1. **Quality Control**: FastQC assesses base-call quality. Trimming removes sequencing adapters.\n2. **Read Alignment**: STAR (RNA) or BWA-MEM (DNA) aligns short reads to the hg38 reference genome.\n3. **Variant Calling**: GATK Mutect2 identifies somatic variants by comparing tumor tissue against matched normal samples.\n4. **Differential Expression**: DESeq2 models count data using negative binomial distributions to find statistically significant fold changes ($p_{adj} < 0.05$).\n5. **Pathway & GSEA Enrichment**: Map differentially expressed genes to KEGG/Reactome pathways using hypergeometric tests to identify active molecular signaling.";
    } else if (prompt_lower.includes("clinical data") || prompt_lower.includes("patient age") || prompt_lower.includes("sex") || prompt_lower.includes("grade") || prompt_lower.includes("subtype") || prompt_lower.includes("mri findings") || prompt_lower.includes("pathology reports")) {
      replyText = "### Clinical Research Data Fields\n\nBioinformatics cohorts incorporate demographic and clinical variables to perform survival analyses and validate genomic findings:\n\n* **Demographics**: Patient age at diagnosis, biological sex.\n* **Tumor Metrics**: Histological Grade (I-IV), molecular subtype classification (Classical, Mesenchymal, Proneural).\n* **Outcomes**: Progression-free survival (PFS), overall survival (OS) in days, recurrence markers.\n* **Pathology**: Immunohistochemistry (IHC) markers (Ki-67 index, GFAP, IDH1-R132H status) and MRI radiological findings (edema, necrotic core volume).";
    } else if (prompt_lower.includes("drugs") || prompt_lower.includes("treatments") || prompt_lower.includes("temozolomide") || prompt_lower.includes("radiation") || prompt_lower.includes("immunotherapy") || prompt_lower.includes("targeted therapy") || prompt_lower.includes("clinical trials")) {
      replyText = "### Drugs & Therapeutic Interventions\n\n1. **Temozolomide (TMZ)**: An oral alkylating agent that methylates DNA at the O6 position of guanine, triggering DNA mismatch repair failure and apoptosis. Resistance is mediated by active MGMT expression.\n2. **Radiation Therapy**: standard external beam RT (60 Gy in 30 fractions) induces double-strand DNA breaks.\n3. **Targeted Therapy**: Small molecule TKIs targeting EGFR/VEGFR or monoclonal antibodies (Bevacizumab) targeting VEGF-mediated vascularization.\n4. **Immunotherapy**: Immune checkpoint inhibitors (Anti-PD1/CTLA4) and CAR-T cell trials face challenges due to the highly immunosuppressive microenvironment of gliomas.";
    } else if (prompt_lower.includes("imaging") || prompt_lower.includes("mri") || prompt_lower.includes("ct") || prompt_lower.includes("pet") || prompt_lower.includes("edema") || prompt_lower.includes("necrosis") || prompt_lower.includes("contrast enhancement")) {
      replyText = "### Medical Imaging in Neuro-Oncology\n\n* **Magnetic Resonance Imaging (MRI)**: Gold standard using specific sequences:\n  - **T1-weighted Contrast Enhanced (T1ce)**: Visualizes blood-brain barrier disruption and active tumor borders.\n  - **T2-FLAIR**: Delineates peritumoral vasogenic edema.\n  - **Diffusion-Weighted Imaging (DWI)**: Assesses cellular density and tissue restriction.\n* **Positron Emission Tomography (PET)**: Employs amino acid tracers (e.g. 18F-FET) to differentiate recurrent active tumor tissue from radiation necrosis.";
    } else if (prompt_lower.includes("tcga") || prompt_lower.includes("gdc") || prompt_lower.includes("geo") || prompt_lower.includes("tcia") || prompt_lower.includes("cgga") || prompt_lower.includes("arrayexpress")) {
      replyText = "### Public Neuro-Oncology Repositories\n\n1. **TCGA (The Cancer Genome Atlas)**: Contains genomic, transcriptomic, and clinical profiles for lower-grade gliomas (LGG) and glioblastoma multiforme (GBM).\n2. **CGGA (Chinese Glioma Genome Atlas)**: Large glioma database hosting sequencing and clinical follow-up records for over 2,000 Chinese patients.\n3. **GEO (Gene Expression Omnibus)**: NCBI repository hosting raw transcriptomic microarrays and RNA-seq datasets.\n4. **TCIA (The Cancer Imaging Archive)**: Public archive mapping DICOM MRI scans to TCGA genomic cohorts.";
    } else if (prompt_lower.includes("glossary") || prompt_lower.includes("terminology") || prompt_lower.includes("abbreviations") || prompt_lower.includes("definitions")) {
      replyText = "### Neuro-Oncology Terminology & Glossary\n\n* **Gliosis**: Nonspecific reactive change of glial cells in response to damage.\n* **Pseudopalisading**: Necrotic regions surrounded by highly cellular borders, diagnostic of GBM.\n* **G-CIMP**: Glioma CpG Island Methylator Phenotype, marked by hypermethylation of CpG islands.\n* **Oncometabolite**: Metabolites that accumulate in tumor cells and drive oncogenic signaling (e.g., 2-HG).\n* **WHO Grade**: World Health Organization grading system ranging from benign (Grade I) to highly malignant (Grade IV).";
    } else if (prompt_lower.includes("papers") || prompt_lower.includes("landmark papers") || prompt_lower.includes("review articles") || prompt_lower.includes("clinical guidelines")) {
      replyText = "### Landmark Neuro-Oncology Research Papers\n\n1. **Stupp et al. (2005, NEJM)**: Established standard of care for glioblastoma (Radiotherapy + adjuvant Temozolomide).\n2. **Yan et al. (2009, NEJM)**: Discovered IDH1 and IDH2 mutations in diffuse gliomas and mapped favorable prognoses.\n3. **Verhaak et al. (2010, Cancer Cell)**: Classified glioblastoma into Proneural, Neural, Classical, and Mesenchymal subtypes based on gene expression profiles.\n4. **Louis et al. (2021, Neuro-Oncology)**: Outlined the 5th edition of the WHO Classification of Tumors of the Central Nervous System, making molecular markers mandatory for classification.";
    } else if (prompt_lower.includes("user workflows") || prompt_lower.includes("research workflow") || prompt_lower.includes("obtain sequencing") || prompt_lower.includes("align reads") || prompt_lower.includes("prepare publication")) {
      replyText = "### Recommended User Research Workflow\n\n1. **Obtain Sequencing Data**: Upload patient raw reads in FASTQ/FASTA format under the **Datasets** tab.\n2. **Perform Quality Control**: Run the **Quality Control** pipeline to verify base accuracy.\n3. **Align & Call Variants**: Align reads to reference genome and run the variant calling script to produce annotated VCF maps.\n4. **Identify DEGs**: Run **Gene Expression** volcano plot parameters to highlight target up-regulated genes.\n5. **Pathway Crosstalk**: Map interaction networks using **Pathway crosstalk** cytoscape tools.\n6. **Publish**: Compile results and export plots directly using the **Reports** compiler tab.";
    } else if (prompt_lower.includes("validation") || prompt_lower.includes("inputs required") || prompt_lower.includes("expected outputs") || prompt_lower.includes("limitations")) {
      replyText = "### Pipeline Validation Guidelines\n\n* **FastQC Analysis**: Requires raw FASTQ inputs. Outputs average Phred score plots. Limitations: Sensitive to low library sequence diversity.\n* **DESeq2 Differentials**: Requires count expression matrix. Outputs Log2 fold changes and adjusted p-values. Limitations: Requires at least 3 replicates per group for statistical power.\n* **Kaplan-Meier survival**: Requires days to event and status (censor/death) flags. Outputs step curves. Limitations: Assumes non-informative censoring.";
    } else if (prompt_lower.includes("website") || prompt_lower.includes("platform") || prompt_lower.includes("dashboard") || prompt_lower.includes("features") || prompt_lower.includes("tabs") || prompt_lower.includes("how to use") || prompt_lower.includes("login") || prompt_lower.includes("project")) {
      replyText = "### NeuroGen AI Platform Details\n\nNeuroGen AI is an advanced, microservice-based bioinformatics platform designed to catalog, analyze, and visualize multi-omic clinical datasets. The platform features:\n\n1. **Dashboard**: Access recent projects, upload history, and active quality-control alerts.\n2. **Datasets Command Center**: Manage sequencing reads, somatic VCF lists, DICOM imaging, and clinical spreadsheets.\n3. **Quality Control (QC)**: Generate Phred quality scoring distributions.\n4. **Gene Expression**: Visualize volcano plots and expression heatmaps.\n5. **Mutation Explorer**: View protein residue mutation frequencies in lollipop graphs.\n6. **Survival (KM)**: Run statistical cohort comparison step curves and log-rank statistics.\n7. **Pathway Crosstalk**: Interactive cytoscape network graphs mapping signaling pathway activity.\n8. **Reports & Exports**: Compile analysis results and export clinical reports.\n9. **AI Chat Assistant**: Get context-aware answers to research queries and summaries of active datasets.";
    } else if (prompt_lower.includes("dataset") || prompt_lower.includes("summarize") || prompt_lower.includes("file")) {
      replyText = "### Workspace Files Summary\n\n* `expression_matrix.csv` (CSV, 1.2 MB) - 8 samples\n* `egfr_somatic_variants.vcf` (VCF, 0.8 MB) - Somatic variant calls";
    } else {
      replyText = "I am the NeuroGen AI Research Assistant, specialized exclusively in brain cancer bioinformatics and the features of this platform.\n\nCurrently, I can only answer questions related to:\n* Brain cancer fundamentals and tumor types\n* Molecular biology and genetics (e.g. TP53, EGFR, IDH1)\n* Biomarkers and omics datasets\n* Sequencing technologies and bioinformatics pipelines\n* Drugs, clinical treatments, and medical imaging (MRI)\n* Public datasets and medical glossaries\n* Features, tools, and workflows of this website/platform\n\nPlease ask a question related to these topics, and I will be happy to assist you!";
    }

    setChatMessages(prev => [
      ...prev.filter(m => m.id !== userMsgId),
      { id: Date.now(), role: "assistant", content: replyText }
    ]);
    setSendingMessage(false);
  };

  // File Upload flow
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileForUpload || !token) return;

    setUploading(true);
    try {
      // 1. Create dataset grouping first
      const datasetName = selectedFileForUpload.name.split(".")[0] + " Dataset";
      const createDsResp = await fetch(`${API_BASE_URL}/api/v1/datasets/projects/${projectId}/datasets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: datasetName, type: datasetType })
      });

      if (!createDsResp.ok) throw new Error("Could not initialize dataset");
      const ds = await createDsResp.json();
      
      // 2. Upload actual file
      const formData = new FormData();
      formData.append("file", selectedFileForUpload);

      const uploadResp = await fetch(`${API_BASE_URL}/api/v1/datasets/datasets/${ds.id}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadResp.ok) throw new Error("File upload failed");
      const uploadedFile = await uploadResp.json();

      // Add to local state
      setFiles([{ ...uploadedFile, dataset_name: ds.name, dataset_id: ds.id }, ...files]);
      setSelectedFileForUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      alert("File uploaded successfully! Ready for QC parsing.");

    } catch (err: any) {
      alert(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // Trigger bioinformatics analysis job
  const runPipelineAnalysis = async (type: string, fileId?: number) => {
    if (!token) return;

    setRunningPipeline(true);
    try {
      const name = `${type} Pipeline - ${new Date().toLocaleTimeString()}`;
      const response = await fetch(`${API_BASE_URL}/api/v1/analyses/projects/${projectId}/analyses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name,
          type: type,
          dataset_file_id: fileId || null
        })
      });

      if (!response.ok) throw new Error("Failed to trigger pipeline");
      const analysis = await response.json();
      
      // Add to analysis list
      setAnalyses([analysis, ...analyses]);
      
      // Select it and load details
      handleSelectAnalysis(analysis.analysis_id);
      alert(`${type} analysis started in the background.`);

    } catch (err: any) {
      alert("Pipeline error: " + err.message);
    } finally {
      setRunningPipeline(false);
    }
  };

  // Load Analysis Details & results
  const handleSelectAnalysis = async (analysisId: number) => {
    if (!token) return;
    setLoadingAnalysis(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/analyses/analyses/${analysisId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        const details = await resp.json();
        setSelectedAnalysis(details);
        setLoadingAnalysis(false);
        return;
      }
    } catch (err) {
      console.error("Analysis load failed. Loading mock details.", err);
    }

    // Find the analysis item in list to know its type
    const localAnal = analyses.find(a => a.id === analysisId) || { name: "Analysis Run", type: "QC" };
    
    let mockResult = {};
    if (localAnal.type === "QC") {
       mockResult = {
          read_count: 5000,
          total_bases: 750000,
          phred_by_cycle: Array.from({ length: 50 }, () => 30 + Math.floor(Math.random() * 8))
       };
    } else if (localAnal.type === "Expression") {
       const genes = ["EGFR", "TP53", "IDH1", "PTEN", "ATRX", "MGMT", "PIK3CA", "AKT1", "MTOR", "NF1", "CIC", "FUBP1", "PDCD1", "CTLA4", "CD274"];
       const samples = ["Sample_01", "Sample_02", "Sample_03", "Sample_04", "Sample_05", "Sample_06", "Sample_07", "Sample_08"];
       const heatmap_data = genes.map(g => {
          const base_expr = g === "EGFR" || g === "AKT1" ? 2.5 : (g === "PTEN" || g === "TP53" ? -2.0 : 0.4);
          return {
             gene: g,
             values: samples.map(() => Number((base_expr + (Math.random() * 2.0 - 1.0)).toFixed(3)))
          };
       });
       const volcano_points = Array.from({ length: 150 }, (_, i) => {
          const gene_sym = i < genes.length ? genes[i] : `Gene_${i}`;
          let fc = (Math.random() * 8.0 - 4.0);
          let pval = Math.random();
          if (["EGFR", "MDM2", "AKT1"].includes(gene_sym)) {
             fc = 1.8 + Math.random() * 1.5;
             pval = 0.00001;
          } else if (["PTEN", "TP53", "ATRX"].includes(gene_sym)) {
             fc = -1.8 - Math.random() * 1.5;
             pval = 0.00001;
          }
          return {
             gene: gene_sym,
             log2FC: Number(fc.toFixed(3)),
             minusLog10P: Number((-Math.log10(Math.max(1e-6, pval))).toFixed(3))
          };
       });
       mockResult = {
          heatmap: { genes, samples, data: heatmap_data },
          volcano: volcano_points
       };
    } else if (localAnal.type === "Mutation") {
       mockResult = {
          gene: "EGFR",
          protein_length: 1210,
          mutations: [
             { position: 289, count: 14, type: "Missense", change: "A289V", domain: "Extracellular" },
             { position: 598, count: 8, type: "Deletion", change: "EGFRvIII", domain: "Extracellular" },
             { position: 858, count: 18, type: "Missense", change: "L858R", domain: "Kinase" }
          ],
          domains: [
             { name: "Extracellular", start: 1, end: 621 },
             { name: "Transmembrane", start: 622, end: 644 },
             { name: "Kinase Domain", start: 685, end: 957 }
          ]
       };
    } else if (localAnal.type === "Survival") {
       const generateCurve = (startProb: number, decay: number) => {
          return Array.from({ length: 12 }, (_, i) => ({
             time: i * 100,
             survival: Math.max(0, startProb - (i * decay) - (Math.random() * 0.05))
          }));
       };
       mockResult = {
          p_value: 0.000412,
          test_performed: "Log-Rank Test",
          curves: {
             "IDH1 Mutant": generateCurve(1.0, 0.04),
             "IDH1 Wildtype": generateCurve(0.9, 0.08)
          }
       };
    } else if (localAnal.type === "Pathway") {
       const expression_vals = {
          EGFR: 2.5, PIK3CA: 1.2, PTEN: -1.8, AKT1: 1.5, MTOR: 0.8,
          TP53: -2.2, MDM2: 1.9, CDKN1A: -1.5, IDH1: 0.5, MGMT: -1.2
       };
       const positions = {
          EGFR: [200, 100], KRAS: [200, 200], RAF1: [200, 300], MAP2K1: [200, 400], MAPK1: [200, 500],
          PIK3CA: [400, 200], PTEN: [550, 200], AKT1: [400, 300], MTOR: [400, 450]
       };
       const nodes = Object.entries(positions).map(([gene, pos]) => {
          const val = expression_vals[gene as keyof typeof expression_vals] || 0;
          return {
             data: {
                id: gene,
                label: gene,
                expression: val,
                color: val > 0 ? "rgb(180, 60, 60)" : "rgb(60, 60, 180)",
                description: `Description of ${gene}`
             },
             position: { x: pos[0], y: pos[1] }
          };
       });
       const edges = [
          { data: { source: "EGFR", target: "PIK3CA", interaction: "activates" } },
          { data: { source: "PTEN", target: "PIK3CA", interaction: "inhibits" } },
          { data: { source: "PIK3CA", target: "AKT1", interaction: "activates" } }
       ];
       mockResult = { nodes, edges };
    }

    setSelectedAnalysis({
       id: analysisId,
       project_id: Number(projectId),
       name: localAnal.name,
       type: localAnal.type,
       status: "Completed",
       created_at: new Date().toISOString(),
       job: {
          id: analysisId * 10,
          status: "Completed",
          error: null,
          result: mockResult,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
       }
    });
    setLoadingAnalysis(false);
  };

  // Invite member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !token) return;

    setInviteLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/projects/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.detail || "Could not add member");
      }

      const newMember = await resp.json();
      setMembers([...members, newMember]);
      setInviteEmail("");
      alert("Team member invited successfully!");
    } catch (err: any) {
      alert(err.message || "Invitation failed.");
    } finally {
      setInviteLoading(false);
    }
  };

  // Generate Report
  const handleGenerateReport = async () => {
    if (!token) return;
    try {
      const name = `Glioblastoma Study Summary - ${new Date().toLocaleDateString()}`;
      const content = `### NeuroGen Research Workspace Report\n\nGenerated for: ${project?.name}\nDate: ${new Date().toLocaleDateString()}\n\nThis compiled clinical document aggregates sequencing base pairs, mutation lollipop graphs (specifically detailing EGFR Exons 2-7 Deletions), and Kaplan-Meier overall survival comparisons for IDH1-mutant diffuse gliomas.\n\n* **Genomic alterations recorded**: EGFR amplification, TP53 missense mutations.\n* **Statistical Survival Evaluation**: Log-rank test demonstrates significance with p-value of 0.000412. The cohort with IDH1 mutations showed longer overall survival times.\n* **Biological pathway active sites**: Cytoscape networks maps upregulation of EGFR-KRAS cascade and downregulation of PTEN phosphatase activity.`;
      
      const resp = await fetch(`${API_BASE_URL}/api/v1/reports/projects/${projectId}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, content, format: "PDF" })
      });

      if (resp.ok) {
        const newRep = await resp.json();
        setReports([newRep, ...reports]);
        alert("Clinical research report generated successfully!");
      }
    } catch (e) {
      alert("Could not compile report.");
    }
  };

  // Mock report download file serialization
  const triggerDownloadReport = async (reportId: number) => {
     if (!token) return;
     try {
       const resp = await fetch(`${API_BASE_URL}/api/v1/reports/reports/${reportId}/download`, {
          headers: { Authorization: `Bearer ${token}` }
       });
       if (resp.ok) {
          const downloadMeta = await resp.json();
          // Create virtual mock link to trigger browser download
          const blob = new Blob([downloadMeta.raw_data], { type: "text/plain" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = downloadMeta.filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
       }
     } catch (e) {
        console.log("Download failed");
     }
  };

  if (loading || !project) {
    return (
      <div className="flex-1 min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-10 h-10 animate-spin text-brand-teal" />
          <span className="text-gray-400 text-sm font-medium">Mounting workspace components...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-brand-dark text-gray-100">
      
      {/* Top Breadcrumb Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-brand-dark/60 border-b border-gray-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-900 border border-transparent hover:border-gray-800 text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <h2 className="font-outfit font-extrabold text-lg text-white leading-none">{project.name}</h2>
            <span className="text-[10px] text-gray-500 font-light mt-1.5 uppercase tracking-wider">Project ID: #{project.id} • Role: {project.role}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-gray-850">
          <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse"></span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Local Sandbox</span>
        </div>
      </header>

      {/* Workspace Sidebar + Stage layout */}
      <div className="flex-1 grid lg:grid-cols-12 items-stretch">
        
        {/* Left Sub-navigation menu */}
        <aside className="lg:col-span-3 border-r border-gray-800/80 bg-slate-950/20 px-4 py-8 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5 px-3">
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Pipelines</span>
            <div className="h-0.5 w-6 bg-brand-teal rounded mt-1"></div>
          </div>
          
          <nav className="flex flex-col gap-1">
            {[
              { id: "datasets", label: "Datasets", icon: HardDrive },
              { id: "disease-intelligence", label: "Disease Intelligence", icon: Sparkles },
              { id: "qc", label: "Quality Control", icon: BarChart3 },
              { id: "expression", label: "Gene Expression", icon: Cpu },
              { id: "mutation", label: "Mutation Analysis", icon: AlertCircle },
              { id: "survival", label: "Survival (KM)", icon: FileCheck },
              { id: "pathway", label: "Pathway Crosstalk", icon: Brain },
              { id: "chat", label: "AI Research Chat", icon: MessageSquareText },
              { id: "reports", label: "Reports & Exports", icon: FileText },
              { id: "team", label: "Team Collaboration", icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedAnalysis(null);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-brand-teal border-l-2 border-brand-teal"
                      : "text-gray-400 hover:text-white hover:bg-slate-900/40"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Dynamic Center Work Stage */}
        <section className="lg:col-span-9 p-8 flex flex-col gap-6 bg-brand-dark">
          
          {/* TAB 1: DATASETS */}
          {activeTab === "datasets" && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-outfit font-extrabold text-xl text-white">Datasets Workspace</h3>
                  <p className="text-gray-400 text-xs font-light">Upload biological inputs (FASTA/FASTQ, CSV expression files, VCF genomic variants, DICOM images, PDFs).</p>
                </div>
              </div>

              {/* Upload Panel */}
              <div className="glass-card p-6 border border-gray-800/80">
                <form onSubmit={handleFileUpload} className="grid md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-5 flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sequence Type</label>
                    <select
                      value={datasetType}
                      onChange={(e) => setDatasetType(e.target.value)}
                      className="glass-input text-xs"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="Genomic">Genomic (FASTA, FASTQ, VCF, BAM)</option>
                      <option value="Transcriptomic">Transcriptomic (CSV Matrices)</option>
                      <option value="Imaging">Imaging (DICOM Scans)</option>
                      <option value="Clinical">Clinical (CSV, PDF Papers)</option>
                    </select>
                  </div>

                  <div className="md:col-span-5">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-gray-800 hover:border-brand-teal/40 rounded-lg p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-950/20 hover:bg-slate-950/40 transition text-center"
                    >
                      <UploadCloud className="w-6 h-6 text-gray-500" />
                      <span className="text-xs text-gray-300 font-semibold leading-none">
                        {selectedFileForUpload ? selectedFileForUpload.name : "Select raw file..."}
                      </span>
                      <span className="text-[9px] text-gray-500 font-light mt-0.5">FASTA, FASTQ, CSV, VCF, DICOM (Max 50MB)</span>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => setSelectedFileForUpload(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={!selectedFileForUpload || uploading}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      {uploading ? (
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Upload"
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Uploaded Files Table */}
              <div className="glass-card overflow-hidden border border-gray-800/80">
                <div className="px-6 py-4 border-b border-gray-850 flex justify-between items-center bg-slate-950/10">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Workspace Files</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-gray-800 text-[10px] text-gray-400 font-bold">{files.length} Files</span>
                </div>

                {files.length === 0 ? (
                  <div className="text-center py-12 text-sm text-gray-500 font-light italic">
                    No files uploaded yet. Select a file above and upload to get started.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950/30 text-gray-400 border-b border-gray-850">
                        <th className="px-6 py-3 font-semibold">Filename</th>
                        <th className="px-6 py-3 font-semibold">Dataset Group</th>
                        <th className="px-6 py-3 font-semibold">Format</th>
                        <th className="px-6 py-3 font-semibold">Size</th>
                        <th className="px-6 py-3 font-semibold">Parser Status</th>
                        <th className="px-6 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850/40">
                      {files.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-900/10 transition">
                          <td className="px-6 py-3.5 font-bold text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-brand-teal shrink-0" />
                            <span className="truncate max-w-[180px]">{f.filename}</span>
                          </td>
                          <td className="px-6 py-3.5 text-gray-400">{f.dataset_name}</td>
                          <td className="px-6 py-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-gray-800 text-[10px] font-bold text-brand-purple">
                              {f.file_type}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-gray-400">{(f.file_size / (1024 * 1024)).toFixed(2)} MB</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${
                              f.status === "parsed"
                                ? "bg-emerald-950/20 text-emerald-400 border-emerald-800/20"
                                : f.status === "parsing"
                                ? "bg-purple-950/20 text-purple-400 border-purple-800/20"
                                : "bg-slate-900 text-gray-400 border-gray-800"
                            }`}>
                              {f.status === "parsing" && <Loader className="w-2.5 h-2.5 animate-spin" />}
                              {f.status === "parsed" && <CheckCircle2 className="w-2.5 h-2.5" />}
                              {f.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => runPipelineAnalysis("QC", f.id)}
                              disabled={runningPipeline || f.status === "parsing"}
                              className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-gray-800 text-[10px] font-bold text-white transition disabled:opacity-40"
                            >
                              Run QC
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 1.5: DISEASE INTELLIGENCE */}
          {activeTab === "disease-intelligence" && (
            <DiseaseIntelligence user={user} token={token} projectId={projectId} />
          )}

          {/* TAB 2: QUALITY CONTROL (QC) */}
          {activeTab === "qc" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-outfit font-extrabold text-xl text-white">Quality Control (QC) Pipeline</h3>
                <p className="text-gray-400 text-xs font-light">Inspect Phred quality parameters, sequence distribution composition, and read stats.</p>
              </div>

              {/* Selector */}
              <div className="flex flex-wrap gap-3">
                {analyses.filter(a => a.type === "QC").map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleSelectAnalysis(a.id)}
                    className={`px-4 py-2.5 rounded-lg border text-xs font-semibold transition ${
                      selectedAnalysis?.id === a.id
                        ? "bg-brand-teal text-white border-transparent shadow-lg shadow-brand-teal/10"
                        : "bg-slate-900 border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {a.name} ({a.status})
                  </button>
                ))}
                
                <button
                  onClick={() => runPipelineAnalysis("QC", files.find(f => f.file_type === "FASTQ")?.id)}
                  disabled={runningPipeline || files.length === 0}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 border border-gray-800 hover:border-brand-teal/40 text-brand-teal text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run QC Demo Pipeline
                </button>
              </div>

              {loadingAnalysis ? (
                <div className="py-12 flex justify-center">
                  <Loader className="w-8 h-8 animate-spin text-brand-teal" />
                </div>
              ) : selectedAnalysis && selectedAnalysis.job?.status === "Completed" ? (
                <div className="grid md:grid-cols-12 gap-6">
                  {/* Stats Cards */}
                  <div className="md:col-span-4 flex flex-col gap-4">
                    <div className="glass-card p-5 border border-gray-800/80">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Reads / Sequences</div>
                      <div className="text-2xl font-outfit font-extrabold text-white mt-1">
                        {selectedAnalysis.job.result.read_count || selectedAnalysis.job.result.sequence_count || "N/A"}
                      </div>
                    </div>
                    
                    <div className="glass-card p-5 border border-gray-800/80">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Base pairs count</div>
                      <div className="text-2xl font-outfit font-extrabold text-white mt-1">
                        {selectedAnalysis.job.result.total_bases || selectedAnalysis.job.result.total_length || "N/A"} bp
                      </div>
                    </div>

                    <div className="glass-card p-5 border border-gray-800/80">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Average Length</div>
                      <div className="text-2xl font-outfit font-extrabold text-white mt-1">
                        {selectedAnalysis.job.result.average_length ? `${selectedAnalysis.job.result.average_length} bp` : "150 bp (standard)"}
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="md:col-span-8 glass-card p-6 border border-gray-800/80">
                    {selectedAnalysis.job.result.phred_by_cycle ? (
                      <QcPhredChart data={selectedAnalysis.job.result.phred_by_cycle} />
                    ) : (
                      <div className="text-center py-12 text-sm text-gray-500 font-light italic">
                        Select a FASTQ analysis run to see Phred score charts.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-card p-12 text-center border border-gray-800/80 text-gray-500 italic text-sm">
                  Click a QC job above or trigger a demo pipeline to display sequencing statistics.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GENE EXPRESSION */}
          {activeTab === "expression" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-outfit font-extrabold text-xl text-white">Transcriptomic Profiling</h3>
                <p className="text-gray-400 text-xs font-light">Evaluate differential tumor gene expression via volcano plots and transcript matrices.</p>
              </div>

              <div className="flex gap-3">
                {analyses.filter(a => a.type === "Expression").map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleSelectAnalysis(a.id)}
                    className={`px-4 py-2.5 rounded-lg border text-xs font-semibold transition ${
                      selectedAnalysis?.id === a.id
                        ? "bg-brand-teal text-white border-transparent shadow-lg shadow-brand-teal/10"
                        : "bg-slate-900 border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {a.name} ({a.status})
                  </button>
                ))}
                
                <button
                  onClick={() => runPipelineAnalysis("Expression")}
                  disabled={runningPipeline}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 border border-gray-800 hover:border-brand-teal/40 text-brand-teal text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run Expression Matrix Demo
                </button>
              </div>

              {loadingAnalysis ? (
                <div className="py-12 flex justify-center">
                  <Loader className="w-8 h-8 animate-spin text-brand-teal" />
                </div>
              ) : selectedAnalysis && selectedAnalysis.job?.status === "Completed" ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Heatmap */}
                  <div className="glass-card p-5 border border-gray-800/80">
                    <ExpressionHeatmap heatmap={selectedAnalysis.job.result.heatmap} />
                  </div>
                  {/* Volcano */}
                  <div className="glass-card p-5 border border-gray-800/80">
                    <ExpressionVolcano points={selectedAnalysis.job.result.volcano} />
                  </div>
                </div>
              ) : (
                <div className="glass-card p-12 text-center border border-gray-800/80 text-gray-500 italic text-sm">
                  Run an Expression analysis job to view expression matrix heatmaps and volcano plots.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MUTATION ANALYSIS */}
          {activeTab === "mutation" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-outfit font-extrabold text-xl text-white">Mutational Frequency</h3>
                <p className="text-gray-400 text-xs font-light">Assess amino acid mutations (e.g. EGFR deletions, TP53 missense changes) across protein coordinates.</p>
              </div>

              <div className="flex gap-3">
                {analyses.filter(a => a.type === "Mutation").map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleSelectAnalysis(a.id)}
                    className={`px-4 py-2.5 rounded-lg border text-xs font-semibold transition ${
                      selectedAnalysis?.id === a.id
                        ? "bg-brand-teal text-white border-transparent shadow-lg shadow-brand-teal/10"
                        : "bg-slate-900 border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {a.name} ({a.status})
                  </button>
                ))}
                
                <button
                  onClick={() => runPipelineAnalysis("Mutation")}
                  disabled={runningPipeline}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 border border-gray-800 hover:border-brand-teal/40 text-brand-teal text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run Mutation Lollipop Demo
                </button>
              </div>

              {loadingAnalysis ? (
                <div className="py-12 flex justify-center">
                  <Loader className="w-8 h-8 animate-spin text-brand-teal" />
                </div>
              ) : selectedAnalysis && selectedAnalysis.job?.status === "Completed" ? (
                <div className="glass-card p-6 border border-gray-800/80">
                  <MutationLollipop 
                    mutations={selectedAnalysis.job.result.mutations} 
                    domains={selectedAnalysis.job.result.domains}
                    proteinLength={selectedAnalysis.job.result.protein_length}
                  />
                </div>
              ) : (
                <div className="glass-card p-12 text-center border border-gray-800/80 text-gray-500 italic text-sm">
                  Run a Mutation analysis job to display Lollipop maps of amino-acid alterations.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SURVIVAL ANALYSIS */}
          {activeTab === "survival" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-outfit font-extrabold text-xl text-white">Clinical Outcome Curves</h3>
                <p className="text-gray-400 text-xs font-light">Compute Kaplan-Meier overall survival estimates and evaluate cohort log-rank statistics.</p>
              </div>

              <div className="flex gap-3">
                {analyses.filter(a => a.type === "Survival").map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleSelectAnalysis(a.id)}
                    className={`px-4 py-2.5 rounded-lg border text-xs font-semibold transition ${
                      selectedAnalysis?.id === a.id
                        ? "bg-brand-teal text-white border-transparent shadow-lg shadow-brand-teal/10"
                        : "bg-slate-900 border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {a.name} ({a.status})
                  </button>
                ))}
                
                <button
                  onClick={() => runPipelineAnalysis("Survival")}
                  disabled={runningPipeline}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 border border-gray-800 hover:border-brand-teal/40 text-brand-teal text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run KM Survival Demo
                </button>
              </div>

              {loadingAnalysis ? (
                <div className="py-12 flex justify-center">
                  <Loader className="w-8 h-8 animate-spin text-brand-teal" />
                </div>
              ) : selectedAnalysis && selectedAnalysis.job?.status === "Completed" ? (
                <div className="glass-card p-6 border border-gray-800/80">
                  <SurvivalKmChart 
                    curves={selectedAnalysis.job.result.curves} 
                    pValue={selectedAnalysis.job.result.p_value}
                  />
                  <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-gray-850 text-xs flex justify-between items-center text-gray-400 font-light">
                     <div>
                        <span>Statistical Method: **{selectedAnalysis.job.result.test_performed}**</span>
                        <span className="mx-3">•</span>
                        <span>Significance status: <strong className={selectedAnalysis.job.result.p_value < 0.05 ? "text-emerald-400" : "text-gray-400"}>
                           {selectedAnalysis.job.result.p_value < 0.05 ? "Highly Significant (p < 0.05)" : "Not Significant"}
                        </strong></span>
                     </div>
                     <span className="italic">Glioblastoma Cohort comparison</span>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-12 text-center border border-gray-800/80 text-gray-500 italic text-sm">
                  Run a Survival analysis job to compute survival step lines.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PATHWAY ANALYSIS */}
          {activeTab === "pathway" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-outfit font-extrabold text-xl text-white">Pathway Crosstalk Networks</h3>
                <p className="text-gray-400 text-xs font-light">Construct signaling cascades and map gene regulatory nodes via Cytoscape.</p>
              </div>

              <div className="flex gap-3">
                {analyses.filter(a => a.type === "Pathway").map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleSelectAnalysis(a.id)}
                    className={`px-4 py-2.5 rounded-lg border text-xs font-semibold transition ${
                      selectedAnalysis?.id === a.id
                        ? "bg-brand-teal text-white border-transparent shadow-lg shadow-brand-teal/10"
                        : "bg-slate-900 border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {a.name} ({a.status})
                  </button>
                ))}
                
                <button
                  onClick={() => runPipelineAnalysis("Pathway")}
                  disabled={runningPipeline}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 border border-gray-800 hover:border-brand-teal/40 text-brand-teal text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run Pathway Network Demo
                </button>
              </div>

              {loadingAnalysis ? (
                <div className="py-12 flex justify-center">
                  <Loader className="w-8 h-8 animate-spin text-brand-teal" />
                </div>
              ) : selectedAnalysis && selectedAnalysis.job?.status === "Completed" ? (
                <div className="glass-card p-6 border border-gray-800/80 min-h-[480px]">
                  <PathwayNetwork graphData={selectedAnalysis.job.result} />
                </div>
              ) : (
                <div className="glass-card p-12 text-center border border-gray-800/80 text-gray-500 italic text-sm">
                  Run a Pathway analysis job to draw the interactive Cytoscape node-link map.
                </div>
              )}
            </div>
          )}

          {/* TAB 7: AI CHAT */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col gap-4 min-h-[460px]">
              <div className="flex items-center justify-between border-b border-gray-850 pb-3">
                <div>
                  <h3 className="font-outfit font-extrabold text-xl text-white">AI Research Assistant</h3>
                  <p className="text-gray-400 text-xs font-light">Ask the domain expert chatbot queries about clinical pathways, target mutations, or workspace files.</p>
                </div>
                
                <button
                  onClick={createChatSession}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-gray-800 text-xs font-semibold text-brand-teal flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> New Discussion
                </button>
              </div>

              {/* Chat Session layout */}
              <div className="flex-1 grid md:grid-cols-12 gap-4 items-stretch">
                
                {/* Left Discussion List */}
                <div className="md:col-span-3 border-r border-gray-850 pr-4 flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                  {chatSessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectChat(s.id)}
                      className={`text-left p-3 rounded-lg text-xs font-semibold truncate ${
                        activeChat?.id === s.id ? "bg-slate-900 text-brand-teal border border-gray-800" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {s.title} (#{s.id})
                    </button>
                  ))}
                </div>

                {/* Right Chat Panel */}
                <div className="md:col-span-9 flex flex-col h-[400px] bg-slate-950/20 rounded-xl border border-gray-800/80 p-4">
                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 pr-1">
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 max-w-[85%] ${
                          msg.role === "user" ? "self-end flex-row-reverse" : "self-start"
                        }`}
                      >
                        <div className={`p-2 rounded-lg border shrink-0 self-start ${
                          msg.role === "user" ? "bg-brand-teal/10 border-brand-teal/20 text-brand-teal" : "bg-brand-purple/10 border-brand-purple/20 text-brand-purple"
                        }`}>
                          <Brain className="w-4 h-4" />
                        </div>
                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-light ${
                          msg.role === "user"
                            ? "bg-slate-900 border border-gray-850 text-white rounded-tr-none"
                            : "bg-slate-950 border border-gray-850/80 text-gray-300 rounded-tl-none prose prose-invert max-w-none"
                        }`}>
                          {/* Rich Text Formats */}
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    {sendingMessage && (
                      <div className="self-start flex gap-3">
                        <div className="p-2 rounded-lg bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                          <Brain className="w-4 h-4" />
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-950 border border-gray-850/80 text-xs text-gray-400 font-light flex items-center gap-1.5">
                          <Loader className="w-3.5 h-3.5 animate-spin text-brand-purple" />
                          AI is analyzing mutation targets...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Explain EGFR mutations in glioblastoma..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 glass-input text-xs"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90 text-white text-xs font-bold transition flex items-center justify-center shrink-0 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: REPORTS */}
          {activeTab === "reports" && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-gray-850 pb-3">
                <div>
                  <h3 className="font-outfit font-extrabold text-xl text-white">Research Reports</h3>
                  <p className="text-gray-400 text-xs font-light">Compile bioinformatics metrics and exports summaries in PDF, Word, or Excel formatting.</p>
                </div>
                
                <button
                  onClick={handleGenerateReport}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-teal to-brand-purple text-white text-xs font-bold transition shadow-lg shadow-brand-teal/15 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Compile Report
                </button>
              </div>

              {reports.length === 0 ? (
                <div className="glass-card p-12 text-center border border-gray-800/80 text-gray-500 italic text-sm">
                  No summary reports generated for this project yet. Click **Compile Report** to synthesize active logs.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {reports.map((r) => (
                    <div key={r.id} className="glass-card p-5 border border-gray-800/80 flex flex-col justify-between min-h-[140px]">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-white text-sm">{r.name}</h4>
                          <span className="px-2 py-0.5 rounded bg-brand-purple/10 text-brand-purple border border-brand-purple/20 text-[9px] font-bold uppercase tracking-wider">{r.format}</span>
                        </div>
                        <p className="text-gray-400 text-[11px] font-light line-clamp-2 mt-2 leading-relaxed">
                          {r.content || "Summary clinical description of the analysis pipelines outputs."}
                        </p>
                      </div>

                      <div className="flex justify-between items-center border-t border-gray-850/50 pt-3 mt-4">
                        <span className="text-[9px] text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                        <button
                          onClick={() => triggerDownloadReport(r.id)}
                          className="px-2.5 py-1.5 rounded bg-slate-900 border border-gray-800 hover:border-brand-teal/40 text-[10px] text-white hover:text-brand-teal font-bold transition flex items-center gap-1"
                        >
                          <Download className="w-3 h-3 text-brand-teal" /> Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 9: TEAM */}
          {activeTab === "team" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-outfit font-extrabold text-xl text-white">Team Collaboration</h3>
                <p className="text-gray-400 text-xs font-light">Supervise project boundary access controls and authorize pipeline results edits.</p>
              </div>

              {/* Add Member form */}
              {["Owner", "Supervise"].includes(project.role) && (
                <div className="glass-card p-5 border border-gray-800/80">
                  <h4 className="font-bold text-sm text-white mb-4">Invite Research Partner</h4>
                  <form onSubmit={handleInviteMember} className="grid sm:grid-cols-12 gap-4 items-end">
                    <div className="sm:col-span-6 flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="collaborator@partner.org"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="glass-input text-xs"
                      />
                    </div>

                    <div className="sm:col-span-4 flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Access Scope</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="glass-input text-xs"
                        style={{ colorScheme: "dark" }}
                      >
                        <option value="Collaborator">Collaborator (Edit & Run)</option>
                        <option value="Supervise">Supervisor (Review & Auth)</option>
                        <option value="Reader">Reader (Read-only)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={inviteLoading}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                      >
                        {inviteLoading ? (
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Invite"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Members Table */}
              <div className="glass-card overflow-hidden border border-gray-800/80">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950/30 text-gray-400 border-b border-gray-850">
                      <th className="px-6 py-3 font-semibold">User name</th>
                      <th className="px-6 py-3 font-semibold">Email</th>
                      <th className="px-6 py-3 font-semibold">System Role</th>
                      <th className="px-6 py-3 font-semibold">Project Role</th>
                      <th className="px-6 py-3 font-semibold">Joined At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850/40">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-900/10 transition">
                        <td className="px-6 py-3.5 font-bold text-white">{m.user.full_name}</td>
                        <td className="px-6 py-3.5 text-gray-400">{m.user.email}</td>
                        <td className="px-6 py-3.5 text-gray-400">{m.user.role}</td>
                        <td className="px-6 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-brand-teal/10 border border-brand-teal/20 text-[9px] font-bold uppercase tracking-wider text-brand-teal">
                            {m.role}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-500">{new Date(m.joined_at || Date.now()).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </section>

      </div>

    </div>
  );
}
