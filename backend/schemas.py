from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    full_name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserCreateAdmin(UserCreate):
    pass # Uses the same fields but different endpoint

class UserOut(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- Complaint Schemas ---
class ComplaintBase(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_url: Optional[str] = None
    is_voice_input: Optional[bool] = False

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdateStatus(BaseModel):
    status: str

class NotificationOut(BaseModel):
    id: int
    channel: str
    recipient: str
    status: str
    sent_at: datetime

    class Config:
        from_attributes = True


class ComplaintOut(ComplaintBase):
    id: int
    user_id: int
    status: str
    authority: Optional[str]
    authority_email: Optional[str]
    drafted_letter: Optional[str]
    created_at: datetime
    updated_at: datetime
    notifications: List[NotificationOut] = []

    class Config:
        from_attributes = True
