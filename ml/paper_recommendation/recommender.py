"""
Scientific Research Paper Recommender Module
Computes cosine similarities between project gene/disease vectors and publication semantic embeddings.
"""
import numpy as np
from typing import List, Dict, Any

class LiteratureRecommender:
    """
    Ranks PubMed and BioRxiv articles based on genomic project context vectors.
    """
    def __init__(self, papers_db: List[Dict[str, Any]] = None):
        # Fallback simulated papers database
        self.papers_db = papers_db or [
            {"id": 1, "title": "Targeted therapies in EGFRvIII glioblastoma cases", "journal": "NEJM", "embedding": np.array([0.15, 0.82, -0.05, 0.44])},
            {"id": 2, "title": "IDH1 R132H metabolic oncometabolites in astrocytoma", "journal": "Nature Genetics", "embedding": np.array([-0.34, 0.12, 0.91, -0.08])},
            {"id": 3, "title": "Immunotherapy resistance pathways in cold tumors", "journal": "Cancer Cell", "embedding": np.array([0.67, 0.05, -0.42, 0.58])},
            {"id": 4, "title": "Single-cell mapping of TAM macrophage infiltration in CNS", "journal": "Cell Reports", "embedding": np.array([0.02, 0.44, 0.23, 0.81])}
        ]

    def _cosine_similarity(self, v1: np.ndarray, v2: np.ndarray) -> float:
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(np.dot(v1, v2) / (norm1 * norm2))

    def recommend(self, query_embedding: np.ndarray, top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Ranks papers by highest cosine similarity to target query vector.
        """
        results = []
        for paper in self.papers_db:
            sim = self._cosine_similarity(query_embedding, paper["embedding"])
            results.append({
                "id": paper["id"],
                "title": paper["title"],
                "journal": paper["journal"],
                "similarity_score": round(sim, 4)
            })
        
        # Sort desc
        results.sort(key=lambda val: val["similarity_score"], reverse=True)
        return results[:top_k]
