"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Brain, X, Send, Loader, Sparkles } from "lucide-react";
import { API_BASE_URL } from "@/utils/api";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I am your NeuroGen AI assistant. I can help you explain brain cancer biology, interpret sequencing datasets, map clinical biomarkers, or navigate this platform. Ask me anything!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Extract active project ID from URL if present (e.g. /project/4)
  const projectMatch = pathname ? pathname.match(/\/project\/(\d+)/) : null;
  const activeProjectId = projectMatch ? parseInt(projectMatch[1], 10) : null;

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    const userMsgId = Date.now();
    setInput("");
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: userText }]);
    setLoading(true);

    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    // 1. Try sending via API if logged in and in a project
    if (storedToken && activeProjectId) {
      try {
        // Find or create a chat session first for this project
        const sessionResp = await fetch(`${API_BASE_URL}/api/v1/ai/projects/${activeProjectId}/chats`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        
        let chatId = null;
        if (sessionResp.ok) {
          const sessions = await sessionResp.json();
          if (sessions.length > 0) {
            chatId = sessions[0].id;
          } else {
            const createResp = await fetch(`${API_BASE_URL}/api/v1/ai/projects/${activeProjectId}/chats`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${storedToken}`
              },
              body: JSON.stringify({ title: "Floating Chat Session" })
            });
            if (createResp.ok) {
              const newSession = await createResp.json();
              chatId = newSession.id;
            }
          }
        }

        if (chatId) {
          const msgResp = await fetch(`${API_BASE_URL}/api/v1/ai/chats/${chatId}/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${storedToken}`
            },
            body: JSON.stringify({ content: userText })
          });

          if (msgResp.ok) {
            const reply = await msgResp.json();
            setMessages((prev) => [...prev.filter((m) => m.id !== userMsgId), reply]);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("API messaging failed, falling back to local simulation.", err);
      }
    }

    // 2. Local fallback logic (matches backend domain scope + off-topic redirect)
    setTimeout(() => {
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

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== userMsgId),
        { id: Date.now(), role: "assistant", content: replyText }
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-tr from-brand-teal to-brand-purple rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center border border-white/10 group"
        title="Ask NeuroGen AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-200" />
        )}
      </button>

      {/* Floating Mini Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[520px] z-50 glass-card border border-gray-800/80 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-950/80 border-b border-gray-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-brand-teal to-brand-purple">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-outfit font-bold text-xs text-white">NeuroGen Assistant</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse"></span>
                  <span className="text-[9px] text-gray-400 font-light uppercase tracking-wider">Oncology Expert</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition p-1 hover:bg-slate-900 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin bg-brand-dark/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "self-end bg-slate-900 text-white rounded-br-none border border-gray-800"
                    : "self-start bg-slate-950/50 text-gray-200 rounded-bl-none border border-gray-900/50"
                }`}
              >
                {/* Parse basic markdown headers */}
                {msg.content.startsWith("###") ? (
                  <div className="prose prose-invert prose-xs">
                    <h4 className="font-outfit font-bold text-brand-teal mb-1">{msg.content.replace("### ", "").split("\n")[0]}</h4>
                    <p className="whitespace-pre-line text-gray-300">
                      {msg.content.substring(msg.content.indexOf("\n") + 1)}
                    </p>
                  </div>
                ) : (
                  <p className="whitespace-pre-line">{msg.content}</p>
                )}
              </div>
            ))}
            {loading && (
              <div className="self-start max-w-[85%] rounded-2xl rounded-bl-none px-4 py-3 bg-slate-950/50 text-gray-400 border border-gray-900/50 flex items-center gap-2">
                <Loader className="w-3.5 h-3.5 animate-spin text-brand-teal" />
                <span className="text-[10px] font-medium tracking-wide">Processing biological query...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-slate-950/60 border-t border-gray-800/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about brain cancer..."
              className="flex-1 px-3 py-2 text-xs rounded-lg glass-input focus:outline-none focus:border-brand-teal/50 bg-brand-dark/40"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-gradient-to-tr from-brand-teal to-brand-purple hover:opacity-95 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
