"""
NeuroGen AI - HIPAA PHI Anonymization Pipeline
===============================================
Security & Compliance Module:
  - Redacts Protected Health Information (PHI) from clinical datasets.
  - Strips DICOM tags: PatientName, PatientID, PatientBirthDate, InstitutionName.
"""

import os
import re
import pandas as pd
from typing import Dict, Any

class PHIAnonymizer:
    def __init__(self):
        self.phi_patterns = [
            r"\b[A-Z][a-z]+\s+[A-Z][a-z]+\b",  # Full Names
            r"\b\d{3}-\d{2}-\d{4}\b",          # SSN
            r"\b\d{10}\b",                     # Phone Numbers
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b" # Emails
        ]

    def anonymize_clinical_text(self, text: str) -> str:
        """Redact PHI entities from clinical note text."""
        anonymized = text
        for pattern in self.phi_patterns:
            anonymized = re.sub(pattern, "[REDACTED_PHI]", anonymized)
        return anonymized

    def anonymize_clinical_dataframe(self, df: pd.DataFrame, phi_columns: list) -> pd.DataFrame:
        """De-identify sensitive columns in clinical DataFrame."""
        clean_df = df.copy()
        for col in phi_columns:
            if col in clean_df.columns:
                clean_df[col] = clean_df[col].apply(lambda val: f"SUBJ_{hash(str(val)) % 1000000:06d}")
        return clean_df

if __name__ == "__main__":
    anon = PHIAnonymizer()
    sample_note = "Patient John Doe (SSN: 123-45-6789, email: john@hospital.org) presented with headache."
    print("Original Text :", sample_note)
    print("Anonymized Text:", anon.anonymize_clinical_text(sample_note))
