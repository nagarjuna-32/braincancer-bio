import os
import sys
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI(title="NeuroGen AI - API Gateway")

# Enable CORS for the frontend to talk to the gateway
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICES = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://localhost:8001"),
    "projects": os.getenv("PROJECT_SERVICE_URL", "http://localhost:8002"),
    "datasets": os.getenv("DATASET_SERVICE_URL", "http://localhost:8003"),
    "analyses": os.getenv("ANALYSIS_SERVICE_URL", "http://localhost:8004"),
    "ai": os.getenv("AI_SERVICE_URL", "http://localhost:8005"),
    "bioinformatics": os.getenv("BIOINFORMATICS_SERVICE_URL", "http://localhost:8006"),
    "reports": os.getenv("REPORT_SERVICE_URL", "http://localhost:8007"),
    "notifications": os.getenv("NOTIFICATION_SERVICE_URL", "http://localhost:8008"),
}

@app.api_route("/api/v1/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def gateway_proxy(service: str, path: str, request: Request):
    if service not in SERVICES:
        raise HTTPException(status_code=404, detail=f"Service '{service}' not found at gateway")
        
    service_base_url = SERVICES[service]
    # Rebuild URL
    url = f"{service_base_url}/{path}"
    
    # Forward query params
    query_params = dict(request.query_params)
    
    # Forward headers
    headers = {}
    for k, v in request.headers.items():
        if k.lower() not in ["host", "content-length"]:
            headers[k] = v
            
    # Read body
    body = await request.body()
    
    # Handle files/multipart upload specifically
    content_type = request.headers.get("content-type", "")
    
    try:
        if "multipart/form-data" in content_type:
            # We must forward multipart files
            form_data = await request.form()
            files_to_send = []
            data_to_send = {}
            
            for key, val in form_data.items():
                if hasattr(val, "filename"): # it's a file
                    file_content = await val.read()
                    files_to_send.append((key, (val.filename, file_content, val.content_type)))
                else:
                    data_to_send[key] = val
                    
            resp = requests.request(
                method=request.method,
                url=url,
                params=query_params,
                headers=headers,
                data=data_to_send,
                files=files_to_send,
                timeout=120.0
            )
        else:
            # Standard request
            resp = requests.request(
                method=request.method,
                url=url,
                params=query_params,
                headers=headers,
                data=body,
                timeout=60.0
            )
            
        # Return response
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            headers=dict(resp.headers)
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Service {service} connection failed: {str(e)}"
        )

@app.get("/health")
def health():
    return {"status": "ok", "gateway": "NeuroGen AI API Gateway online"}
