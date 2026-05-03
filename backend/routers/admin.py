from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from database import get_db
from models import User, Complaint
from schemas import UserOut
from auth.dependencies import require_admin

router = APIRouter()

@router.get("/users", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    users = db.query(User).all()
    return users

@router.put("/users/{id}/deactivate")
def deactivate_user(id: int, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    return {"message": f"User {id} deactivated"}

def _enum_key(val):
    """SQLite returns plain str for Enum columns; ORM may return Enum — normalize to str."""
    if val is None:
        return "none"
    return val.value if hasattr(val, "value") else str(val)


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    category_counts = db.query(Complaint.category, func.count(Complaint.id)).group_by(Complaint.category).all()
    category_stats = {_enum_key(cat): count for cat, count in category_counts}

    status_counts = db.query(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status).all()
    status_stats = {_enum_key(stat): count for stat, count in status_counts}

    total_complaints = db.query(Complaint).count()
    
    return {
        "total_complaints": total_complaints,
        "by_category": category_stats,
        "by_status": status_stats
    }
