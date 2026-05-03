from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from database import get_db
from models import Complaint, Notification, User
from schemas import ComplaintCreate, ComplaintOut, ComplaintUpdateStatus
from auth.dependencies import get_current_user, require_admin
from agents.pipeline import process_complaint_pipeline

router = APIRouter()


def _complaint_payload(complaint: ComplaintCreate) -> dict:
    if hasattr(complaint, "model_dump"):
        return complaint.model_dump()
    return complaint.dict()


@router.post("/", response_model=ComplaintOut)
def create_complaint(
    complaint: ComplaintCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_complaint = Complaint(
        **_complaint_payload(complaint),
        user_id=current_user.id,
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    background_tasks.add_task(process_complaint_pipeline, new_complaint.id)
    return new_complaint


@router.get("/", response_model=List[ComplaintOut])
def get_own_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaints = (
        db.query(Complaint)
        .options(joinedload(Complaint.notifications))
        .filter(Complaint.user_id == current_user.id)
        .all()
    )
    return complaints


@router.get("/all", response_model=List[ComplaintOut])
def get_all_complaints(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status"),
):
    q = db.query(Complaint).options(joinedload(Complaint.notifications))
    if category:
        q = q.filter(Complaint.category == category)
    if status:
        q = q.filter(Complaint.status == status)
    return q.order_by(Complaint.created_at.desc()).all()


@router.get("/{id}", response_model=ComplaintOut)
def get_complaint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = (
        db.query(Complaint)
        .options(joinedload(Complaint.notifications))
        .filter(Complaint.id == id)
        .first()
    )
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role != "admin" and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this complaint")

    return complaint


@router.put("/{id}/status", response_model=ComplaintOut)
def update_complaint_status(
    id: int,
    status_update: ComplaintUpdateStatus,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    complaint = (
        db.query(Complaint)
        .options(joinedload(Complaint.notifications))
        .filter(Complaint.id == id)
        .first()
    )
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.status = status_update.status
    db.commit()
    db.refresh(complaint)
    return complaint


@router.delete("/{id}")
def delete_complaint(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Remove dependent rows first (notifications FK → complaints.id).
    db.query(Notification).filter(Notification.complaint_id == id).delete(
        synchronize_session=False
    )
    db.delete(complaint)
    db.commit()
    return {"message": "Complaint deleted successfully"}
