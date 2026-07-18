"""
NeuroGen AI - External Biomedical APIs Integration Service
==========================================================
Port: 8009
Integrates 10 authoritative biomedical APIs:
  1. NCBI Entrez          - Gene info, sequences, publications
  2. GEO (via NCBI)       - Gene expression dataset metadata
  3. TCGA / GDC           - Clinical metadata, mutation, RNA-seq
  4. PubMed (via NCBI)    - Research papers, abstracts, authors
  5. Ensembl              - Gene annotations, transcripts, coordinates
  6. UniProt              - Protein info, functions, domains
  7. KEGG                 - Biological & metabolic pathways
  8. Reactome             - Signaling pathway data
  9. Gene Ontology (GO)   - Biological processes, molecular functions
 10. ClinicalTrials.gov   - Clinical trials, drug trials, status

Smart Caching Strategy:
  - In-memory TTL cache (simulates Redis) keyed by query parameters.
  - Cache TTL: 6 hours for gene/protein data, 24 hours for pathway data.
  - Fallback: Returns curated mock data when upstream APIs are unavailable.
"""

import os
import time
import json
import requests
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NeuroGen AI - External Biomedical APIs Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.redis_client import redis_cache_get, redis_cache_set

# =====================================================================
# Distributed Cache (Redis primary, in-memory secondary TTL fallback)
# =====================================================================
_cache: Dict[str, Dict[str, Any]] = {}

def cache_get(key: str) -> Optional[Any]:
    """Retrieve item from Redis cache or in-memory fallback if not expired."""
    r_data = redis_cache_get(key)
    if r_data is not None:
        return r_data

    if key in _cache:
        item = _cache[key]
        if time.time() < item["expires_at"]:
            return item["data"]
        else:
            del _cache[key]
    return None

def cache_set(key: str, data: Any, ttl_seconds: int = 21600):
    """Store item in Redis cache and in-memory fallback with TTL. Default 6 hours."""
    redis_cache_set(key, data, ttl_seconds)
    _cache[key] = {
        "data": data,
        "expires_at": time.time() + ttl_seconds
    }

def safe_get(url: str, params: dict = None, timeout: int = 10) -> Optional[requests.Response]:
    """Make HTTP GET request with error handling."""
    try:
        resp = requests.get(url, params=params, timeout=timeout, headers={"User-Agent": "NeuroGenAI/1.0"})
        resp.raise_for_status()
        return resp
    except Exception:
        return None

# =====================================================================
# 1. NCBI Entrez / Gene API
# =====================================================================
NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
NCBI_API_KEY = os.getenv("NCBI_API_KEY", "")

def ncbi_params(extra: dict = None) -> dict:
    p = {"retmode": "json", "retmax": 20}
    if NCBI_API_KEY:
        p["api_key"] = NCBI_API_KEY
    if extra:
        p.update(extra)
    return p

@app.get("/ncbi/gene")
def ncbi_gene_search(symbol: str = Query(..., description="Gene symbol e.g. EGFR")):
    """Search NCBI Gene database for a given gene symbol."""
    cache_key = f"ncbi_gene:{symbol.upper()}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    # Search for gene IDs
    search_resp = safe_get(f"{NCBI_BASE}/esearch.fcgi",
        params=ncbi_params({"db": "gene", "term": f"{symbol}[Gene Name] AND Homo sapiens[Organism]"}))

    if search_resp:
        data = search_resp.json()
        ids = data.get("esearchresult", {}).get("idlist", [])
        if ids:
            # Fetch summary for first result
            summary_resp = safe_get(f"{NCBI_BASE}/esummary.fcgi",
                params=ncbi_params({"db": "gene", "id": ids[0]}))
            if summary_resp:
                result = summary_resp.json()
                uid = ids[0]
                gene_data = result.get("result", {}).get(uid, {})
                payload = {
                    "gene_id": uid,
                    "symbol": gene_data.get("name", symbol.upper()),
                    "full_name": gene_data.get("description", ""),
                    "summary": gene_data.get("summary", ""),
                    "chromosome": gene_data.get("chromosome", ""),
                    "location": gene_data.get("maplocation", ""),
                    "organism": "Homo sapiens",
                    "source": "NCBI Gene"
                }
                cache_set(cache_key, payload)
                return payload

    # Fallback mock data for known brain cancer genes
    fallbacks = {
        "EGFR": {"gene_id": "1956", "symbol": "EGFR", "full_name": "Epidermal Growth Factor Receptor",
                  "summary": "Receptor tyrosine kinase binding EGF family members; mutated in ~50% of GBM.",
                  "chromosome": "7", "location": "7p11.2", "organism": "Homo sapiens", "source": "mock"},
        "IDH1": {"gene_id": "3417", "symbol": "IDH1", "full_name": "Isocitrate Dehydrogenase (NADP+) 1",
                  "summary": "Catalyzes the oxidative decarboxylation of isocitrate. R132H mutation is defining for lower-grade gliomas.",
                  "chromosome": "2", "location": "2q33.3", "organism": "Homo sapiens", "source": "mock"},
        "TP53": {"gene_id": "7157", "symbol": "TP53", "full_name": "Tumor Protein P53",
                  "summary": "Master regulator of cell cycle; mutated in >50% of all human cancers.",
                  "chromosome": "17", "location": "17p13.1", "organism": "Homo sapiens", "source": "mock"},
        "PTEN": {"gene_id": "5728", "symbol": "PTEN", "full_name": "Phosphatase And Tensin Homolog",
                  "summary": "Tumor suppressor that negatively regulates PI3K/AKT signaling; frequently deleted in GBM.",
                  "chromosome": "10", "location": "10q23.31", "organism": "Homo sapiens", "source": "mock"},
        "MGMT": {"gene_id": "4255", "symbol": "MGMT", "full_name": "O-6-Methylguanine-DNA Methyltransferase",
                  "summary": "DNA repair enzyme; promoter methylation predicts response to temozolomide.",
                  "chromosome": "10", "location": "10q26.3", "organism": "Homo sapiens", "source": "mock"},
    }
    result = fallbacks.get(symbol.upper(), {
        "gene_id": "unknown", "symbol": symbol.upper(), "full_name": f"{symbol.upper()} gene",
        "summary": "Gene annotation not available offline. Connect to NCBI for live data.",
        "chromosome": "unknown", "location": "unknown", "organism": "Homo sapiens", "source": "mock"
    })
    return result

@app.get("/ncbi/sequence")
def ncbi_gene_sequence(gene_id: str = Query(..., description="NCBI Gene ID e.g. 1956")):
    """Retrieve nucleotide sequence summary for a given NCBI Gene ID."""
    cache_key = f"ncbi_seq:{gene_id}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    resp = safe_get(f"{NCBI_BASE}/elink.fcgi",
        params=ncbi_params({"dbfrom": "gene", "db": "nuccore", "id": gene_id}))

    fallback = {
        "gene_id": gene_id,
        "linked_sequences": [f"NM_00{gene_id[:4]}.2", f"NR_00{gene_id[:4]}.1"],
        "message": "Connect to NCBI for live sequence data.",
        "source": "mock"
    }
    cache_set(cache_key, fallback)
    return fallback

# =====================================================================
# 2. GEO (Gene Expression Omnibus) - via NCBI Entrez
# =====================================================================
@app.get("/geo/datasets")
def geo_search_datasets(term: str = Query(..., description="Search term e.g. glioblastoma RNA-seq")):
    """Search GEO for expression datasets matching a brain cancer query."""
    cache_key = f"geo:{term.lower().replace(' ', '_')}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    resp = safe_get(f"{NCBI_BASE}/esearch.fcgi",
        params=ncbi_params({"db": "gds", "term": term, "retmax": 10}))

    if resp:
        data = resp.json()
        ids = data.get("esearchresult", {}).get("idlist", [])
        if ids:
            sum_resp = safe_get(f"{NCBI_BASE}/esummary.fcgi",
                params=ncbi_params({"db": "gds", "id": ",".join(ids[:5])}))
            if sum_resp:
                result_data = sum_resp.json().get("result", {})
                datasets = []
                for uid in ids[:5]:
                    rec = result_data.get(uid, {})
                    datasets.append({
                        "gse_id": rec.get("accession", f"GSE{uid}"),
                        "title": rec.get("title", ""),
                        "summary": rec.get("summary", "")[:200],
                        "platform": rec.get("gpl", ""),
                        "samples": rec.get("n_samples", 0),
                    })
                payload = {"query": term, "datasets": datasets, "source": "GEO"}
                cache_set(cache_key, payload, ttl_seconds=86400)
                return payload

    # Fallback
    payload = {
        "query": term,
        "datasets": [
            {"gse_id": "GSE4290", "title": "Gene expression in astrocytic tumors", "summary": "Illumina RNA-seq of GBM vs normal brain.", "platform": "GPL570", "samples": 180},
            {"gse_id": "GSE13041", "title": "Molecular classification of gliomas", "summary": "Affymetrix expression profiling of 195 gliomas.", "platform": "GPL96", "samples": 195},
            {"gse_id": "GSE55918", "title": "IDH1/2 mutant and wildtype gliomas", "summary": "RNA-Seq of 325 glioma patients with molecular annotation.", "platform": "GPL11154", "samples": 325},
        ],
        "source": "mock"
    }
    cache_set(cache_key, payload, ttl_seconds=86400)
    return payload

# =====================================================================
# 3. TCGA / GDC API
# =====================================================================
GDC_BASE = "https://api.gdc.cancer.gov"

@app.get("/gdc/cases")
def gdc_search_cases(disease: str = Query("GBM", description="Disease code e.g. GBM, LGG"), limit: int = 10):
    """Query GDC for cases (patients) in a given TCGA project."""
    cache_key = f"gdc_cases:{disease.upper()}:{limit}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    project_id = f"TCGA-{disease.upper()}"
    resp = safe_get(f"{GDC_BASE}/cases",
        params={"filters": json.dumps({"op": "=", "content": {"field": "project.project_id", "value": project_id}}),
                "fields": "case_id,submitter_id,demographic.age_at_index,demographic.gender,diagnoses.primary_diagnosis,diagnoses.vital_status",
                "size": limit, "format": "json"})

    if resp:
        data = resp.json()
        hits = data.get("data", {}).get("hits", [])
        cases = []
        for hit in hits:
            demo = hit.get("demographic", {}) or {}
            diag = (hit.get("diagnoses") or [{}])[0]
            cases.append({
                "case_id": hit.get("submitter_id"),
                "age": demo.get("age_at_index"),
                "gender": demo.get("gender"),
                "primary_diagnosis": diag.get("primary_diagnosis"),
                "vital_status": diag.get("vital_status"),
            })
        payload = {"project": project_id, "total": data.get("data", {}).get("pagination", {}).get("total", 0), "cases": cases, "source": "GDC"}
        cache_set(cache_key, payload)
        return payload

    # Fallback
    import random
    cases = [{"case_id": f"TCGA-{disease.upper()}-{i:04d}", "age": random.randint(35, 75),
               "gender": random.choice(["male","female"]), "primary_diagnosis": "Glioblastoma",
               "vital_status": random.choice(["Dead","Alive"])} for i in range(1, min(limit+1, 11))]
    payload = {"project": f"TCGA-{disease.upper()}", "total": 600, "cases": cases, "source": "mock"}
    cache_set(cache_key, payload)
    return payload

@app.get("/gdc/mutations")
def gdc_mutations(gene: str = Query("EGFR", description="Gene symbol"), project: str = Query("TCGA-GBM")):
    """Retrieve somatic mutation frequency for a gene in a TCGA project."""
    cache_key = f"gdc_mut:{gene.upper()}:{project.upper()}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    resp = safe_get(f"{GDC_BASE}/ssms",
        params={"filters": json.dumps({"op": "and", "content": [
                    {"op": "=", "content": {"field": "consequence.transcript.gene.symbol", "value": gene.upper()}},
                    {"op": "=", "content": {"field": "cases.project.project_id", "value": project}}]}),
                "fields": "genomic_dna_change,mutation_type,consequence.transcript.consequence_type",
                "size": 20, "format": "json"})

    if resp:
        data = resp.json()
        hits = data.get("data", {}).get("hits", [])
        mutations = [{"change": h.get("genomic_dna_change"), "type": h.get("mutation_type")} for h in hits]
        payload = {"gene": gene.upper(), "project": project, "mutations": mutations, "source": "GDC"}
        cache_set(cache_key, payload)
        return payload

    # Fallback
    known = {
        "EGFR": [{"change": "chr7:g.55210994G>A", "type": "SNP"}, {"change": "chr7:g.55191821_55191822insGGT", "type": "INS"}],
        "IDH1": [{"change": "chr2:g.208248388C>T", "type": "SNP"}],
        "TP53": [{"change": "chr17:g.7673802C>T", "type": "SNP"}, {"change": "chr17:g.7674220G>A", "type": "SNP"}],
    }
    payload = {"gene": gene.upper(), "project": project, "mutations": known.get(gene.upper(), []), "source": "mock"}
    cache_set(cache_key, payload)
    return payload

# =====================================================================
# 4. PubMed / NCBI
# =====================================================================
@app.get("/pubmed/search")
def pubmed_search(query: str = Query(...), max_results: int = 10):
    """Search PubMed for research papers matching a biomedical query."""
    cache_key = f"pubmed:{query.lower().replace(' ','_')}:{max_results}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    search_resp = safe_get(f"{NCBI_BASE}/esearch.fcgi",
        params=ncbi_params({"db": "pubmed", "term": query, "retmax": max_results, "sort": "relevance"}))

    if search_resp:
        ids = search_resp.json().get("esearchresult", {}).get("idlist", [])
        if ids:
            sum_resp = safe_get(f"{NCBI_BASE}/esummary.fcgi",
                params=ncbi_params({"db": "pubmed", "id": ",".join(ids)}))
            if sum_resp:
                result = sum_resp.json().get("result", {})
                papers = []
                for uid in ids:
                    rec = result.get(uid, {})
                    papers.append({
                        "pmid": uid,
                        "title": rec.get("title", ""),
                        "authors": ", ".join([a.get("name", "") for a in rec.get("authors", [])[:3]]),
                        "journal": rec.get("fulljournalname", ""),
                        "pub_date": rec.get("pubdate", ""),
                        "url": f"https://pubmed.ncbi.nlm.nih.gov/{uid}/"
                    })
                payload = {"query": query, "papers": papers, "source": "PubMed"}
                cache_set(cache_key, payload, ttl_seconds=43200)
                return payload

    # Fallback
    payload = {"query": query, "papers": [
        {"pmid": "26404127", "title": "Radiotherapy plus concomitant and adjuvant temozolomide for glioblastoma",
         "authors": "Stupp R, Mason WP, van den Bent MJ", "journal": "NEJM", "pub_date": "2005 Mar 10",
         "url": "https://pubmed.ncbi.nlm.nih.gov/26404127/"},
        {"pmid": "19228619", "title": "An integrated genomic analysis of human glioblastoma multiforme",
         "authors": "Verhaak RG et al.", "journal": "Cancer Cell", "pub_date": "2010 Jan 19",
         "url": "https://pubmed.ncbi.nlm.nih.gov/19228619/"},
        {"pmid": "19270080", "title": "IDH1 and IDH2 mutations in gliomas",
         "authors": "Yan H et al.", "journal": "NEJM", "pub_date": "2009 Feb 19",
         "url": "https://pubmed.ncbi.nlm.nih.gov/19270080/"},
    ], "source": "mock"}
    cache_set(cache_key, payload, ttl_seconds=43200)
    return payload

# =====================================================================
# 5. Ensembl REST API
# =====================================================================
ENSEMBL_BASE = "https://rest.ensembl.org"

@app.get("/ensembl/gene")
def ensembl_gene(symbol: str = Query(..., description="Gene symbol e.g. EGFR")):
    """Retrieve Ensembl gene annotations for a human gene symbol."""
    cache_key = f"ensembl:{symbol.upper()}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    resp = safe_get(f"{ENSEMBL_BASE}/xrefs/symbol/homo_sapiens/{symbol.upper()}",
        params={"content-type": "application/json"})

    if resp:
        data = resp.json()
        if data:
            gene_id = data[0].get("id", "")
            detail_resp = safe_get(f"{ENSEMBL_BASE}/lookup/id/{gene_id}",
                params={"content-type": "application/json", "expand": 1})
            if detail_resp:
                d = detail_resp.json()
                payload = {
                    "ensembl_id": gene_id,
                    "symbol": d.get("display_name", symbol),
                    "description": d.get("description", ""),
                    "biotype": d.get("biotype", ""),
                    "chromosome": d.get("seq_region_name", ""),
                    "start": d.get("start"),
                    "end": d.get("end"),
                    "strand": d.get("strand"),
                    "assembly": d.get("assembly_name", "GRCh38"),
                    "source": "Ensembl"
                }
                cache_set(cache_key, payload)
                return payload

    # Fallback
    known = {
        "EGFR": {"ensembl_id": "ENSG00000146648", "symbol": "EGFR", "description": "epidermal growth factor receptor", "biotype": "protein_coding", "chromosome": "7", "start": 55019017, "end": 55211628, "strand": 1, "assembly": "GRCh38"},
        "IDH1": {"ensembl_id": "ENSG00000138413", "symbol": "IDH1", "description": "isocitrate dehydrogenase (NADP(+)) 1", "biotype": "protein_coding", "chromosome": "2", "start": 208236227, "end": 208255212, "strand": 1, "assembly": "GRCh38"},
        "TP53": {"ensembl_id": "ENSG00000141510", "symbol": "TP53", "description": "tumor protein p53", "biotype": "protein_coding", "chromosome": "17", "start": 7661779, "end": 7687538, "strand": -1, "assembly": "GRCh38"},
        "PTEN": {"ensembl_id": "ENSG00000171862", "symbol": "PTEN", "description": "phosphatase and tensin homolog", "biotype": "protein_coding", "chromosome": "10", "start": 87862628, "end": 87971930, "strand": 1, "assembly": "GRCh38"},
        "MGMT": {"ensembl_id": "ENSG00000170430", "symbol": "MGMT", "description": "O-6-methylguanine-DNA methyltransferase", "biotype": "protein_coding", "chromosome": "10", "start": 129467235, "end": 129497290, "strand": 1, "assembly": "GRCh38"},
    }
    result = known.get(symbol.upper(), {"ensembl_id": "unknown", "symbol": symbol.upper(), "description": "Annotation not available offline.", "biotype": "protein_coding", "chromosome": "unknown", "start": None, "end": None, "strand": 1, "assembly": "GRCh38"})
    result["source"] = "mock"
    return result

# =====================================================================
# 6. UniProt API
# =====================================================================
UNIPROT_BASE = "https://rest.uniprot.org"

@app.get("/uniprot/protein")
def uniprot_protein(symbol: str = Query(..., description="Gene symbol e.g. EGFR")):
    """Retrieve protein information from UniProt for a given gene symbol."""
    cache_key = f"uniprot:{symbol.upper()}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    resp = safe_get(f"{UNIPROT_BASE}/uniprotkb/search",
        params={"query": f"gene:{symbol.upper()} AND organism_id:9606 AND reviewed:true",
                "format": "json", "size": 1})

    if resp:
        data = resp.json()
        results = data.get("results", [])
        if results:
            entry = results[0]
            payload = {
                "accession": entry.get("primaryAccession", ""),
                "entry_name": entry.get("uniProtkbId", ""),
                "protein_name": entry.get("proteinDescription", {}).get("recommendedName", {}).get("fullName", {}).get("value", ""),
                "function": next((c.get("texts", [{}])[0].get("value", "") for c in entry.get("comments", []) if c.get("commentType") == "FUNCTION"), ""),
                "length": entry.get("sequence", {}).get("length", 0),
                "domains": [f.get("description", "") for f in entry.get("features", []) if f.get("type") == "Domain"][:5],
                "source": "UniProt"
            }
            cache_set(cache_key, payload)
            return payload

    # Fallback
    known = {
        "EGFR": {"accession": "P00533", "entry_name": "EGFR_HUMAN", "protein_name": "Epidermal growth factor receptor",
                  "function": "Receptor tyrosine kinase; binds ligands of the EGF family. Amplified/mutated in GBM.", "length": 1210, "domains": ["Furin-like", "Protein kinase"]},
        "IDH1": {"accession": "O75874", "entry_name": "IDHC_HUMAN", "protein_name": "Isocitrate dehydrogenase [NADP] cytoplasmic",
                  "function": "Catalyzes the oxidative decarboxylation of isocitrate. R132H oncogenic mutation produces 2-HG.", "length": 414, "domains": ["Isocitrate/isopropylmalate dehydrogenase"]},
        "TP53": {"accession": "P04637", "entry_name": "P53_HUMAN", "protein_name": "Cellular tumor antigen p53",
                  "function": "Master tumor suppressor regulating the DNA damage response, apoptosis, and cell cycle arrest.", "length": 393, "domains": ["P53 TAD1", "P53 TAD2", "P53 DNA-binding", "Tetramerization"]},
        "PTEN": {"accession": "P60484", "entry_name": "PTEN_HUMAN", "protein_name": "Phosphatidylinositol 3,4,5-trisphosphate 3-phosphatase and dual-specificity protein phosphatase",
                  "function": "Tumor suppressor lipid phosphatase. Negatively regulates AKT/PI3K survival signaling.", "length": 403, "domains": ["Phosphatase", "C2"]},
    }
    result = known.get(symbol.upper(), {"accession": "unknown", "entry_name": symbol.upper(), "protein_name": symbol.upper(), "function": "Connect to UniProt for live protein data.", "length": 0, "domains": []})
    result["source"] = "mock"
    return result

# =====================================================================
# 7. KEGG Pathways API
# =====================================================================
KEGG_BASE = "https://rest.kegg.jp"

@app.get("/kegg/pathways")
def kegg_gene_pathways(gene_symbol: str = Query(..., description="Gene symbol e.g. EGFR")):
    """List KEGG biological pathways involving a given gene."""
    cache_key = f"kegg:{gene_symbol.upper()}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    # KEGG uses lowercase gene symbol prefixed with 'hsa:'
    resp = safe_get(f"{KEGG_BASE}/link/pathway/hsa:{gene_symbol.lower()}")

    if resp and resp.text:
        lines = resp.text.strip().split("\n")
        pathways = []
        for line in lines:
            parts = line.split("\t")
            if len(parts) == 2:
                pathway_id = parts[1].strip()
                pathways.append({"pathway_id": pathway_id, "url": f"https://www.kegg.jp/pathway/{pathway_id}"})
        payload = {"gene": gene_symbol.upper(), "kegg_pathways": pathways[:15], "source": "KEGG"}
        cache_set(cache_key, payload, ttl_seconds=86400)
        return payload

    # Fallback
    known = {
        "EGFR": ["hsa05223 (Non-small cell lung cancer)", "hsa04012 (ErbB signaling)", "hsa04010 (MAPK signaling)", "hsa04151 (PI3K/AKT signaling)", "hsa05210 (Colorectal cancer)", "hsa05215 (Prostate cancer)"],
        "IDH1": ["hsa00020 (Citrate cycle TCA)", "hsa01200 (Carbon metabolism)", "hsa05211 (Renal cell carcinoma)"],
        "TP53": ["hsa04115 (p53 signaling pathway)", "hsa04110 (Cell cycle)", "hsa05206 (MicroRNAs in cancer)"],
        "PTEN": ["hsa04151 (PI3K-AKT signaling)", "hsa04068 (FoxO signaling)", "hsa05215 (Prostate cancer)"],
    }
    pathways = [{"pathway_id": p, "url": ""} for p in known.get(gene_symbol.upper(), ["hsa01100 (Metabolic pathways)"])]
    payload = {"gene": gene_symbol.upper(), "kegg_pathways": pathways, "source": "mock"}
    cache_set(cache_key, payload, ttl_seconds=86400)
    return payload

# =====================================================================
# 8. Reactome API
# =====================================================================
REACTOME_BASE = "https://reactome.org/ContentService"

@app.get("/reactome/pathways")
def reactome_gene_pathways(gene_symbol: str = Query(..., description="Gene symbol e.g. EGFR")):
    """Retrieve Reactome signaling pathways associated with a gene."""
    cache_key = f"reactome:{gene_symbol.upper()}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    resp = safe_get(f"{REACTOME_BASE}/data/mapping/UniProt/{gene_symbol.upper()}/pathways",
        params={"species": "9606"})

    if resp:
        data = resp.json()
        pathways = [{"pathway_id": p.get("stId"), "name": p.get("displayName"), "url": f"https://reactome.org/PathwayBrowser/#/{p.get('stId')}"} for p in data[:15]]
        payload = {"gene": gene_symbol.upper(), "reactome_pathways": pathways, "source": "Reactome"}
        cache_set(cache_key, payload, ttl_seconds=86400)
        return payload

    # Fallback
    known = {
        "EGFR": [{"pathway_id": "R-HSA-177929", "name": "EGFR interacts with phospholipase C-gamma", "url": "https://reactome.org/PathwayBrowser/#/R-HSA-177929"},
                 {"pathway_id": "R-HSA-1250196", "name": "SHC1 events in EGFR signaling", "url": "https://reactome.org/PathwayBrowser/#/R-HSA-1250196"}],
        "IDH1": [{"pathway_id": "R-HSA-71403", "name": "Citric acid cycle (TCA cycle)", "url": "https://reactome.org/PathwayBrowser/#/R-HSA-71403"}],
        "TP53": [{"pathway_id": "R-HSA-5633007", "name": "Regulation of TP53 Expression and Degradation", "url": "https://reactome.org/PathwayBrowser/#/R-HSA-5633007"},
                 {"pathway_id": "R-HSA-69620", "name": "Cell Cycle Checkpoints", "url": "https://reactome.org/PathwayBrowser/#/R-HSA-69620"}],
    }
    pathways = known.get(gene_symbol.upper(), [{"pathway_id": "R-HSA-1640170", "name": "Cell Cycle", "url": ""}])
    payload = {"gene": gene_symbol.upper(), "reactome_pathways": pathways, "source": "mock"}
    cache_set(cache_key, payload, ttl_seconds=86400)
    return payload

# =====================================================================
# 9. Gene Ontology (GO) via QuickGO API
# =====================================================================
QUICKGO_BASE = "https://www.ebi.ac.uk/QuickGO/services"

@app.get("/go/annotations")
def go_annotations(gene_symbol: str = Query(..., description="Gene symbol e.g. EGFR"), aspect: Optional[str] = Query(None, description="P=process, F=function, C=component")):
    """Retrieve Gene Ontology annotations for a human gene."""
    cache_key = f"go:{gene_symbol.upper()}:{aspect}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    params = {"geneProductId": f"UniProtKB:{gene_symbol.upper()}", "taxonId": "9606", "limit": 20}
    if aspect:
        params["aspect"] = aspect

    resp = safe_get(f"{QUICKGO_BASE}/annotation/search", params=params)

    if resp:
        data = resp.json()
        results = data.get("results", [])
        annotations = [{"go_id": r.get("goId"), "go_name": r.get("goName"), "aspect": r.get("goAspect"), "evidence": r.get("evidenceCode")} for r in results[:15]]
        payload = {"gene": gene_symbol.upper(), "go_annotations": annotations, "source": "Gene Ontology (QuickGO)"}
        cache_set(cache_key, payload, ttl_seconds=86400)
        return payload

    # Fallback
    known = {
        "EGFR": [{"go_id": "GO:0005006", "go_name": "epidermal growth factor-activated receptor activity", "aspect": "molecular_function", "evidence": "EXP"},
                 {"go_id": "GO:0043066", "go_name": "negative regulation of apoptosis", "aspect": "biological_process", "evidence": "IDA"},
                 {"go_id": "GO:0005886", "go_name": "plasma membrane", "aspect": "cellular_component", "evidence": "IDA"}],
        "IDH1": [{"go_id": "GO:0004448", "go_name": "isocitrate dehydrogenase (NADP+) activity", "aspect": "molecular_function", "evidence": "EXP"},
                 {"go_id": "GO:0006102", "go_name": "isocitrate metabolic process", "aspect": "biological_process", "evidence": "IDA"}],
        "TP53": [{"go_id": "GO:0003677", "go_name": "DNA binding", "aspect": "molecular_function", "evidence": "EXP"},
                 {"go_id": "GO:0006915", "go_name": "apoptosis", "aspect": "biological_process", "evidence": "IDA"},
                 {"go_id": "GO:0005654", "go_name": "nucleoplasm", "aspect": "cellular_component", "evidence": "IDA"}],
    }
    annotations = known.get(gene_symbol.upper(), [{"go_id": "GO:0008150", "go_name": "biological_process", "aspect": "biological_process", "evidence": "ND"}])
    payload = {"gene": gene_symbol.upper(), "go_annotations": annotations, "source": "mock"}
    cache_set(cache_key, payload, ttl_seconds=86400)
    return payload

# =====================================================================
# 10. ClinicalTrials.gov API
# =====================================================================
CTGOV_BASE = "https://clinicaltrials.gov/api/v2"

@app.get("/clinicaltrials/search")
def clinicaltrials_search(condition: str = Query("glioblastoma"), intervention: Optional[str] = Query(None), status: Optional[str] = Query("RECRUITING")):
    """Search ClinicalTrials.gov for active brain cancer clinical trials."""
    cache_key = f"ct:{condition.lower()}:{intervention}:{status}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    params = {"query.cond": condition, "countTotal": "true", "pageSize": 10}
    if intervention:
        params["query.intr"] = intervention
    if status:
        params["filter.overallStatus"] = status

    resp = safe_get(f"{CTGOV_BASE}/studies", params=params)

    if resp:
        data = resp.json()
        studies = data.get("studies", [])
        trials = []
        for s in studies:
            proto = s.get("protocolSection", {})
            trials.append({
                "nct_id": proto.get("identificationModule", {}).get("nctId", ""),
                "title": proto.get("identificationModule", {}).get("briefTitle", ""),
                "status": proto.get("statusModule", {}).get("overallStatus", ""),
                "phase": proto.get("designModule", {}).get("phases", [""])[0] if proto.get("designModule", {}).get("phases") else "",
                "sponsor": proto.get("sponsorCollaboratorsModule", {}).get("leadSponsor", {}).get("name", ""),
                "url": f"https://clinicaltrials.gov/study/{proto.get('identificationModule',{}).get('nctId','')}",
            })
        payload = {"condition": condition, "total": data.get("totalCount", 0), "trials": trials, "source": "ClinicalTrials.gov"}
        cache_set(cache_key, payload, ttl_seconds=21600)
        return payload

    # Fallback
    payload = {"condition": condition, "total": 320, "trials": [
        {"nct_id": "NCT02910583", "title": "Nivolumab vs Bevacizumab in GBM", "status": "COMPLETED", "phase": "PHASE3", "sponsor": "Bristol-Myers Squibb", "url": "https://clinicaltrials.gov/study/NCT02910583"},
        {"nct_id": "NCT03548298", "title": "CAR-T Cells Targeting EGFRvIII for GBM", "status": "RECRUITING", "phase": "PHASE1", "sponsor": "University of Pennsylvania", "url": "https://clinicaltrials.gov/study/NCT03548298"},
        {"nct_id": "NCT04729959", "title": "TMZ + Lomustine in IDH-Wildtype GBM", "status": "RECRUITING", "phase": "PHASE2", "sponsor": "EORTC", "url": "https://clinicaltrials.gov/study/NCT04729959"},
        {"nct_id": "NCT03233204", "title": "Rindopepimut + Bevacizumab in EGFRvIII+ GBM", "status": "COMPLETED", "phase": "PHASE3", "sponsor": "Celldex Therapeutics", "url": "https://clinicaltrials.gov/study/NCT03233204"},
    ], "source": "mock"}
    cache_set(cache_key, payload, ttl_seconds=21600)
    return payload

# =====================================================================
# Unified Gene Intelligence Endpoint (aggregates all APIs for a single gene)
# =====================================================================
@app.get("/gene/intelligence")
def gene_intelligence(symbol: str = Query(..., description="Gene symbol e.g. EGFR, IDH1, TP53")):
    """
    Master endpoint: Aggregates data from all 10 APIs for a given gene.
    Returns gene info, protein, pathways, GO annotations, clinical trials,
    recent publications, GDC mutations, and GEO datasets in one call.
    """
    cache_key = f"intel:{symbol.upper()}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    base = "http://localhost:8009"
    sym = symbol.strip().upper()

    def _call(path: str) -> Any:
        try:
            r = requests.get(f"{base}{path}", timeout=15)
            if r.ok:
                return r.json()
        except Exception:
            pass
        return {}

    result = {
        "gene":              _call(f"/ncbi/gene?symbol={sym}"),
        "ensembl":           _call(f"/ensembl/gene?symbol={sym}"),
        "protein":           _call(f"/uniprot/protein?symbol={sym}"),
        "kegg_pathways":     _call(f"/kegg/pathways?gene_symbol={sym}"),
        "reactome_pathways": _call(f"/reactome/pathways?gene_symbol={sym}"),
        "go_annotations":    _call(f"/go/annotations?gene_symbol={sym}"),
        "gdc_mutations":     _call(f"/gdc/mutations?gene={sym}&project=TCGA-GBM"),
        "publications":      _call(f"/pubmed/search?query={sym}+glioma+glioblastoma&max_results=5"),
        "clinical_trials":   _call(f"/clinicaltrials/search?condition=glioblastoma&intervention={sym}&status=RECRUITING"),
        "geo_datasets":      _call(f"/geo/datasets?term={sym}+glioma"),
        "source":            "NeuroGen AI Aggregated Intelligence"
    }
    cache_set(cache_key, result, ttl_seconds=3600)
    return result


# =====================================================================
# Cache Stats Endpoint
# =====================================================================
@app.get("/cache/stats")
def cache_stats():
    """Return current cache statistics."""
    now = time.time()
    active = {k: round(v["expires_at"] - now, 0) for k, v in _cache.items() if v["expires_at"] > now}
    return {
        "total_cached_keys": len(active),
        "keys": list(active.keys()),
        "ttl_remaining_seconds": active
    }

@app.delete("/cache/clear")
def cache_clear():
    """Clear the entire cache."""
    _cache.clear()
    return {"message": "Cache cleared successfully."}

@app.get("/health")
def health():
    return {"status": "ok", "service": "NeuroGen AI External Biomedical APIs", "version": "1.0.0",
            "apis": ["NCBI", "GEO", "GDC/TCGA", "PubMed", "Ensembl", "UniProt", "KEGG", "Reactome", "GO", "ClinicalTrials.gov"]}
