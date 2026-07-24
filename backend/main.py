import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is on sys.path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import init_db
from app.routers.auth import router as auth_router
from app.routers.projects import router as projects_router
from app.routers.datasets import router as datasets_router
from app.routers.analyses import router as analyses_router
from app.routers.ai import router as ai_router
from app.routers.bioinformatics import router as bioinformatics_router
from app.routers.reports import router as reports_router
from app.routers.notifications import router as notifications_router
from app.routers.external_apis import router as external_apis_router

app = FastAPI(
    title="NeuroGen AI - Unified Platform API",
    description="Unified single-process backend consolidating all 10 domain APIRouters.",
    version="6.0.0"
)

# CORS middleware for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all domain routers
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(datasets_router)
app.include_router(analyses_router)
app.include_router(ai_router)
app.include_router(bioinformatics_router)
app.include_router(reports_router)
app.include_router(notifications_router)
app.include_router(external_apis_router)

@app.on_event("startup")
def on_startup():
    """Initialize database tables on single-process startup."""
    init_db()

@app.get("/")
@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "online",
        "platform": "NeuroGen AI Monolithic Engine",
        "architecture": "Single Uvicorn Process (Unified APIRouters)",
        "version": "6.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
