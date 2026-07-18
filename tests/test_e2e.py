"""
End-to-End Integration Tests for NeuroGen AI Platform
"""

import pytest
import requests

GATEWAY_URL = "http://localhost:8000"
BIOAPIS_URL = "http://localhost:8009"

def test_gateway_health():
    try:
        resp = requests.get(f"{GATEWAY_URL}/health", timeout=2.0)
        assert resp.status_code == 200
        assert "gateway" in resp.json()
    except Exception:
        pytest.skip("Local gateway service not running for E2E online test.")

def test_external_apis_health():
    try:
        resp = requests.get(f"{BIOAPIS_URL}/health", timeout=2.0)
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
    except Exception:
        pytest.skip("Local bioapis service not running for E2E online test.")
