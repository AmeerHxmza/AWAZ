from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
import os

from database import get_db
from models import User
from schemas import UserCreate, UserOut, Token, UserCreateAdmin
from auth.jwt_handler import get_password_hash, verify_password, create_access_token
from auth.dependencies import get_current_user

router = APIRouter()
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "super_secret_admin_creation_key")

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user.password)
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_password,
        role="user" # Always force 'user'
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token = create_access_token(
        data={
            "sub": user.email,
            "email": user.email,
            "user_id": user.id,
            "role": user.role,
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/create-admin", response_model=UserOut)
def create_admin(
    user: UserCreateAdmin,
    x_admin_secret: str | None = Header(
        default=None,
        alias="X-Admin-Secret",
        description="Must exactly match the ADMIN_SECRET value in the API server .env file.",
    ),
    db: Session = Depends(get_db),
):
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")
        
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user.password)
    new_admin = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_password,
        role="admin" # Force 'admin'
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
