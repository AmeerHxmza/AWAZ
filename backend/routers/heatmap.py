from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Complaint, User
from agents.agent4_geo import build_map
from auth.dependencies import get_current_user

router = APIRouter()


@router.get("/", response_class=HTMLResponse)
def get_heatmap(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None, description="Filter by complaint category"),
    date_from: Optional[datetime] = Query(None, description="ISO start (inclusive)"),
    date_to: Optional[datetime] = Query(None, description="ISO end (inclusive)"),
):
    q = db.query(Complaint)
    if category:
        q = q.filter(Complaint.category == category)
    if date_from is not None:
        q = q.filter(Complaint.created_at >= date_from)
    if date_to is not None:
        q = q.filter(Complaint.created_at <= date_to)

    complaints = q.all()
    if not any(c.latitude is not None and c.longitude is not None for c in complaints):
        return HTMLResponse(
            content=(
                "<h1>No geo-tagged complaints for this filter.</h1>"
                "<p>Submit complaints with GPS coordinates to see the heatmap.</p>"
            ),
            status_code=404,
        )

    m = build_map(complaints)
    return HTMLResponse(content=m.get_root().render())


@router.get("/me", response_class=HTMLResponse)
def get_my_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Map of geo-tagged complaints filed by the authenticated user only."""
    complaints = db.query(Complaint).filter(Complaint.user_id == current_user.id).all()
    if not any(c.latitude is not None and c.longitude is not None for c in complaints):
        return HTMLResponse(
            content=(
                "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Your reports</title>"
                "<style>body{font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;color:#1c1917;}"
                "h1{font-size:1.25rem;}p{color:#57534e;line-height:1.6;}</style></head><body>"
                "<h1>No map locations yet</h1>"
                "<p>None of your reports include GPS coordinates. When you submit with location enabled, "
                "pins will appear here.</p></body></html>"
            ),
            status_code=200,
        )

    m = build_map(complaints)
    return HTMLResponse(content=m.get_root().render())
