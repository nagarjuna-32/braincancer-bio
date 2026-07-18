# Security Policy & HIPAA Guidelines 🔒

## Reporting Security Vulnerabilities

The NeuroGen AI team takes security and patient data privacy very seriously. If you discover a potential vulnerability, please report it privately rather than creating a public GitHub issue.

Please report security concerns to:
- **Email:** `security@neurogen.ai` or open a confidential security advisory on GitHub.

We respond to security reports within **24 hours** and aim to release patches promptly.

---

## 🛡 Security & HIPAA Compliance Safeguards

- **Protected Health Information (PHI):** De-identification pipelines (`scripts/anonymize_phi.py`) strip DICOM tags and redact patient names/SSNs before storage.
- **Authentication:** Bearer JWT Tokens using HS256 algorithms and NIST-compliant PBKDF2 SHA256 password hashing.
- **Role-Based Access Control (RBAC):** Granular permissions matrix (`Admin`, `Lab Head`, `Researcher`, `Student`, `Reader`).
- **Input Sanitization:** SQLAlchemy ORM parameter binding prevents SQL Injection attacks.
