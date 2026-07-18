"""
NeuroGen AI - Knowledge Graph Engine (Sprint 4)
==============================================
Builds multi-tier directional biological relationships:
  Disease -> Genes -> Variants -> Proteins -> Pathways -> Biomarkers -> Publications -> Clinical Trials
"""

from typing import Dict, Any, List

class MultiTierKnowledgeGraph:
    def __init__(self, disease_type: str = "Brain Cancer (GBM)"):
        self.disease_type = disease_type

    def build_graph(self, primary_gene: str = "EGFR") -> Dict[str, Any]:
        """
        Builds the 8-tier multi-relationship knowledge graph for a given disease and primary gene.
        """
        gene_sym = primary_gene.upper()

        nodes = [
            {"id": f"disease_{self.disease_type}", "label": self.disease_type, "type": "Disease", "level": 1, "color": "#f44336"},
            {"id": f"gene_{gene_sym}", "label": f"{gene_sym} Gene", "type": "Gene", "level": 2, "color": "#7c3aed"},
            {"id": f"variant_{gene_sym}_vIII", "label": f"{gene_sym}vIII Mutation", "type": "Variant", "level": 3, "color": "#ff9800"},
            {"id": f"protein_{gene_sym}", "label": f"{gene_sym} RTK Protein", "type": "Protein", "level": 4, "color": "#2196f3"},
            {"id": "pathway_ErbB", "label": "ErbB / PI3K Signaling", "type": "Pathway", "level": 5, "color": "#4caf50"},
            {"id": f"biomarker_{gene_sym}_amp", "label": f"{gene_sym} Amplification Biomarker", "type": "Biomarker", "level": 6, "color": "#e91e63"},
            {"id": "pub_PMC26404127", "label": "Stupp et al. NEJM 2005", "type": "Publication", "level": 7, "color": "#3f51b5"},
            {"id": "trial_NCT07544992", "label": "EGFR-CAR-T Phase I (NCT07544992)", "type": "ClinicalTrial", "level": 8, "color": "#8bc34a"},
        ]

        edges = [
            {"source": f"disease_{self.disease_type}", "target": f"gene_{gene_sym}", "relation": "ASSOCIATED_WITH"},
            {"source": f"gene_{gene_sym}", "target": f"variant_{gene_sym}_vIII", "relation": "HAS_MUTATION"},
            {"source": f"variant_{gene_sym}_vIII", "target": f"protein_{gene_sym}", "relation": "EXPRESSES_PROTEIN"},
            {"source": f"protein_{gene_sym}", "target": "pathway_ErbB", "relation": "ACTIVATES_PATHWAY"},
            {"source": "pathway_ErbB", "target": f"biomarker_{gene_sym}_amp", "relation": "DEFINES_BIOMARKER"},
            {"source": f"biomarker_{gene_sym}_amp", "target": "pub_PMC26404127", "relation": "CITED_IN"},
            {"source": "pub_PMC26404127", "target": "trial_NCT07544992", "relation": "LEADS_TO_TRIAL"}
        ]

        return {
            "disease": self.disease_type,
            "primary_gene": gene_sym,
            "tier_count": 8,
            "nodes": nodes,
            "edges": edges
        }
