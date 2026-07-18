import os
import datetime
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

# Add project root to path if needed (done via runner, but let's import safely)
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from app.database import get_db, User, Organization, init_db

app = FastAPI(title="NeuroGen AI - Auth Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("JWT_SECRET", "neurogen_secret_key_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer()

class RegisterSchema(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "Researcher"
    organization_name: Optional[str] = None

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginSchema(BaseModel):
    token: str

class TokenSchema(BaseModel):
    access_token: str
    token_type: str
    user: dict

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user_from_token(token: str, db: Session) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    return get_current_user_from_token(credentials.credentials, db)

@app.on_event("startup")
def on_startup():
    init_db()

@app.post("/register", response_model=TokenSchema)
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Set up organization if provided
    org_id = None
    if data.organization_name:
        org = db.query(Organization).filter(Organization.name == data.organization_name).first()
        if not org:
            org = Organization(name=data.organization_name)
            db.add(org)
            db.commit()
            db.refresh(org)
        org_id = org.id

    # Create user
    hashed_pwd = get_password_hash(data.password)
    user = User(
        email=data.email,
        hashed_password=hashed_pwd,
        full_name=data.full_name,
        role=data.role,
        organization_id=org_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    user_dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "organization_id": user.organization_id
    }
    
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user_dict}

@app.post("/login", response_model=TokenSchema)
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    user_dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "organization_id": user.organization_id
    }

    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user_dict}

@app.post("/google", response_model=TokenSchema)
def google_login(data: GoogleLoginSchema, db: Session = Depends(get_db)):
    # Mock google login. If the token is presented, register/login a mock user.
    # In production, this would verify the token against Google APIs.
    email = f"google_user_{data.token[:8]}@neurogen.ai"
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        org = db.query(Organization).filter(Organization.name == "Google Research").first()
        if not org:
            org = Organization(name="Google Research")
            db.add(org)
            db.commit()
            db.refresh(org)
            
        user = User(
            email=email,
            hashed_password=get_password_hash("google_oauth_fallback_passphrase_2026"),
            full_name=f"Google Researcher {data.token[:4]}",
            role="Researcher",
            organization_id=org.id
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    user_dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "organization_id": user.organization_id
    }

    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user_dict}

@app.get("/me")
def get_me(user: User = Depends(current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "organization_id": user.organization_id
    }

@app.post("/verify")
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        user = get_current_user_from_token(credentials.credentials, db)
        return {"valid": True, "user_id": user.id, "email": user.email, "role": user.role}
    except HTTPException:
        return {"valid": False}

class RefreshSchema(BaseModel):
    refresh_token: Optional[str] = None

@app.post("/refresh", response_model=TokenSchema)
def refresh_token(data: Optional[RefreshSchema] = None, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    user = get_current_user_from_token(credentials.credentials, db)
    user_dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "organization_id": user.organization_id
    }
    token = create_access_token(data={"sub": user.email}, expires_delta=datetime.timedelta(days=7))
    return {"access_token": token, "token_type": "bearer", "user": user_dict}

class ForgotPasswordSchema(BaseModel):
    email: EmailStr

@app.post("/forgot-password")
def forgot_password(data: ForgotPasswordSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # Return success to prevent email enumeration
        return {"message": "If the email exists, a password reset link has been dispatched."}
    reset_token = create_access_token(data={"sub": user.email, "type": "reset"}, expires_delta=datetime.timedelta(hours=1))
    return {"message": "Password reset token generated.", "reset_token": reset_token}

class ResetPasswordSchema(BaseModel):
    reset_token: str
    new_password: str

@app.post("/reset-password")
def reset_password(data: ResetPasswordSchema, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.reset_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if not email or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid reset token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Expired or invalid reset token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password successfully reset."}

@app.post("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    return {"message": f"Email {email} verified successfully."}

@app.get("/permissions")
def get_role_permissions(user: User = Depends(current_user)):
    ROLE_PERMISSIONS = {
        "Admin": ["create:project", "delete:project", "upload:dataset", "run:analysis", "manage:users"],
        "Lab Head": ["create:project", "upload:dataset", "run:analysis", "export:report"],
        "Researcher": ["create:project", "upload:dataset", "run:analysis"],
        "Student": ["view:project", "run:analysis"],
        "Reader": ["view:project"]
    }
    perms = ROLE_PERMISSIONS.get(user.role, ["view:project"])
    return {"role": user.role, "permissions": perms}

