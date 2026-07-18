"""
Unit & API Tests for Auth Service & RBAC Permissions
"""

import pytest
from fastapi.testclient import TestClient
from backend.services.auth.main import app

from backend.app.database import init_db

client = TestClient(app)

def test_health():
    init_db()
    response = client.get("/me")
    assert response.status_code == 403 or response.status_code == 401

def test_register_and_login():
    init_db()
    email = "test_researcher_unit@neurogen.ai"
    password = "SecurePassword2026!"
    
    # Register
    reg_resp = client.post("/register", json={
        "email": email,
        "password": password,
        "full_name": "Dr. Unit Tester",
        "role": "Researcher",
        "organization_name": "Unit Test Lab"
    })
    if reg_resp.status_code == 400: # Already exists
        login_resp = client.post("/login", json={"email": email, "password": password})
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
    else:
        assert reg_resp.status_code == 200
        token = reg_resp.json()["access_token"]
        
    assert token is not None

    # Test permissions endpoint
    perm_resp = client.get("/permissions", headers={"Authorization": f"Bearer {token}"})
    assert perm_resp.status_code == 200
    assert "create:project" in perm_resp.json()["permissions"]
