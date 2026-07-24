import os
import time
import json
import requests
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query

from app.redis_client import redis_cache_get, redis_cache_set

router = APIRouter(tags=["External Biomedical APIs"])

_cache: Dict[str, Dict[str, Any]] = {}

def cache_get(key: str) -> Optional[Any]:
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
    redis_cache_set(key, data, ttl_seconds)
    _cache[key] = {
        "data": data,
        "expires_at": time.time() + ttl_seconds
    }

def safe_get(url: str, params: dict = None, timeout: int = 10) -> Optional[requests.Response]:
    try:
        resp = requests.get(url, params=params, timeout=timeout, headers={"User-Agent": "NeuroGenAI/1.0"})
        resp.raise_for_status()
        return resp
    except Exception:
        return None

NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
NCBI_API_KEY = os.getenv("NCBI_API_KEY", "")

def ncbi_params(extra: dict = None) -> dict:
    p = {"retmode": "json", "retmax": 20}
    if NCBI_API_KEY:
        p["api_key"] = NCBI_API_KEY
    if extra:
        p.update(extra)
    return p

@router.get("/api/v1/external_apis/ncbi/gene")
@router.get("/api/v1/bioapis/ncbi/gene")
def ncbi_gene_search(symbol: str = Query(..., description="Gene symbol e.g. EGFR")):
    cache_key = f"ncbi_gene:{symbol.upper()}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    search_resp = safe_get(f"{NCBI_BASE}/esearch.fcgi",
        params=ncbi_params({"db": "gene", "term": f"{symbol}[Gene Name] AND Homo sapiens[Organism]"}))

    if search_resp:
        data = search_resp.json()
        ids = data.get("esearchresult", {}).get("idlist", [])
        if ids:
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
    return fallbacks.get(symbol.upper(), {
        "gene_id": "unknown", "symbol": symbol.upper(), "full_name": f"{symbol.upper()} gene",
        "summary": "Gene annotation query fallback.",
        "chromosome": "unknown", "location": "unknown", "organism": "Homo sapiens", "source": "mock"
    })

@router.get("/api/v1/external_apis/publications/search")
@router.get("/api/v1/bioapis/publications/search")
def search_pubmed_papers(query: str = Query("Glioblastoma EGFR", description="Search query")):
    cache_key = f"pubmed:{query.lower().replace(' ', '_')}"
    cached = cache_get(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    search_resp = safe_get(f"{NCBI_BASE}/esearch.fcgi",
        params=ncbi_params({"db": "pubmed", "term": query, "retmax": 10}))

    if search_resp:
        data = search_resp.json()
        ids = data.get("esearchresult", {}).get("idlist", [])
        if ids:
            summary_resp = safe_get(f"{NCBI_BASE}/esummary.fcgi",
                params=ncbi_params({"db": "pubmed", "id": ",".join(ids[:5])}))
            if summary_resp:
                result_data = summary_resp.json().get("result", {})
                papers = []
                for uid in ids[:5]:
                    rec = result_data.get(uid, {})
                    papers.append({
                        "pmid": uid,
                        "title": rec.get("title", ""),
                        "authors": [a.get("name") for a in rec.get("authors", [])[:3]],
                        "journal": rec.get("source", ""),
                        "pub_date": rec.get("pubdate", "")
                    })
                payload = {"query": query, "papers": papers, "source": "PubMed"}
                cache_set(cache_key, payload, ttl_seconds=86400)
                return payload

    payload = {
        "query": query,
        "papers": [
            {"pmid": "26404127", "title": "Radiotherapy plus concomitant and adjuvant temozolomide for glioblastoma.", "authors": ["Stupp R", "Mason WP", "van den Bent MJ"], "journal": "N Engl J Med", "pub_date": "2005"},
            {"pmid": "19270080", "title": "IDH1 and IDH2 mutations in gliomas.", "authors": ["Yan H", "Parsons DW", "Jin G"], "journal": "N Engl J Med", "pub_date": "2009"},
            {"pmid": "19228619", "title": "Integrated genomic analysis of human glioblastoma multiforme.", "authors": ["Verhaak RG", "Hoadley KA", "Purdom E"], "journal": "Cancer Cell", "pub_date": "2010"}
        ],
        "source": "mock"
    }
    cache_set(cache_key, payload, ttl_seconds=86400)
    return payload
