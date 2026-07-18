"""
NeuroGen AI - Semantic RAG Vector Search Engine
================================================
Computes cosine similarity embeddings for PubMed research literature and TCGA clinical case notes.
"""

import numpy as np
from typing import List, Dict, Any

class VectorSearchEngine:
    def __init__(self):
        # In-memory vector index of curated neuro-oncology abstracts
        self.index = [
            {
                "id": "PMC26404127",
                "title": "Radiotherapy plus concomitant and adjuvant temozolomide for glioblastoma",
                "text": "Stupp protocol: Concomitant radiotherapy with temozolomide followed by 6 cycles of adjuvant temozolomide significantly improves overall survival in newly diagnosed glioblastoma multiforme.",
                "vector": np.array([0.85, 0.42, 0.12, 0.91, 0.33], dtype=np.float32)
            },
            {
                "id": "PMC19270080",
                "title": "IDH1 and IDH2 mutations in gliomas",
                "text": "Somatic mutations in IDH1 R132H occur in >70% of WHO grade II-III astrocytomas and secondary glioblastomas, generating oncometabolite D-2-hydroxyglutarate (2-HG) and defining favorable prognosis.",
                "vector": np.array([0.15, 0.94, 0.88, 0.21, 0.65], dtype=np.float32)
            },
            {
                "id": "PMC19228619",
                "title": "Integrated genomic analysis of human glioblastoma multiforme",
                "text": "TCGA classification defines classical (EGFR amplification), proneural (IDH1 mutation, PDGFRA), neural, and mesenchymal (NF1 deletion) transcriptomic subtypes in GBM.",
                "vector": np.array([0.72, 0.68, 0.55, 0.84, 0.79], dtype=np.float32)
            }
        ]

    def _query_to_vector(self, query: str) -> np.ndarray:
        """Simulate dense vector embedding generation."""
        q_lower = query.lower()
        v = np.zeros(5, dtype=np.float32)
        if "temozolomide" in q_lower or "stupp" in q_lower or "treatment" in q_lower:
            v += np.array([0.8, 0.4, 0.1, 0.9, 0.3])
        if "idh1" in q_lower or "mutation" in q_lower or "2-hg" in q_lower:
            v += np.array([0.1, 0.9, 0.8, 0.2, 0.6])
        if "subtype" in q_lower or "egfr" in q_lower or "tcga" in q_lower:
            v += np.array([0.7, 0.6, 0.5, 0.8, 0.7])
        norm = np.linalg.norm(v)
        return v / norm if norm > 0 else np.array([0.2, 0.2, 0.2, 0.2, 0.2], dtype=np.float32)

    def search(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """Search literature index via vector cosine similarity."""
        query_vec = self._query_to_vector(query)
        results = []
        for doc in self.index:
            doc_vec = doc["vector"]
            sim = float(np.dot(query_vec, doc_vec) / (np.linalg.norm(query_vec) * np.linalg.norm(doc_vec) + 1e-8))
            results.append({
                "id": doc["id"],
                "title": doc["title"],
                "text": doc["text"],
                "similarity_score": round(sim, 4)
            })
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:top_k]
