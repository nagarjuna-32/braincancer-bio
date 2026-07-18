# Contributing to NeuroGen AI 🧬

Thank you for your interest in contributing to **NeuroGen AI**! We welcome contributions from software engineers, bioinformaticians, machine learning researchers, and clinicians.

---

## 🚀 Getting Started

1. **Fork & Clone:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/braincancer-bio.git
   cd braincancer-bio
   ```

2. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Set Up Development Environment:**
   - Install Python 3.12+ dependencies: `pip install -r backend/requirements.txt`
   - Install Node.js 24+ dependencies: `cd frontend && npm install`

---

## 🧪 Testing Before Submitting

Always run unit tests before opening a pull request:
```bash
python -m pytest tests/ -v
```

---

## 📝 Code Guidelines

- **Python:** Follow PEP 8 guidelines. Use type hints for FastAPI endpoint inputs/outputs.
- **TypeScript / Next.js:** Ensure `npm run build` compiles with zero TypeScript errors.
- **Database Modals:** Any changes to SQLAlchemy models in `backend/app/database.py` must maintain backward compatibility or include migration scripts.
- **Scientific Rigor:** Add citation PMIDs or DOIs for any new bioinformatics pipelines or clinical scoring algorithms added.

---

## 📥 Submitting Pull Requests

1. Commit your changes with clear, descriptive commit messages:
   `git commit -m "feat(bioinformatics): Add RNA-Seq GSEA pathway enrichment algorithm"`
2. Push to your branch and submit a Pull Request to `main`.
