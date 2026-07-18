"""
NeuroGen AI - API Gateway Top-Level Module
=========================================
Imports and runs the API Gateway application.
"""

from backend.gateway.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
