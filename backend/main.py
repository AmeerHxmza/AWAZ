from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import engine, Base, SessionLocal, get_db
from models import Complaint
from auth.router import router as auth_router
from routers.complaints import router as complaints_router
from routers.stt import router as stt_router
from routers.admin import router as admin_router
from routers.heatmap import router as heatmap_router
from agents.agent6_tracker import run as run_tracker

# Create all database tables
Base.metadata.create_all(bind=engine)

def run_agent6():
    db = SessionLocal()
    try:
        run_tracker(db)
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler()
    scheduler.add_job(run_agent6, 'interval', hours=1)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(
    title="AWAZ API",
    description="AWAZ — civic voice & reporting for Islamabad (SDG 6 & 11)",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev. In prod: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(complaints_router, prefix="/complaints", tags=["complaints"])
app.include_router(stt_router, prefix="/stt", tags=["stt"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(heatmap_router, prefix="/heatmap", tags=["heatmap"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AWAZ API"}


@app.get("/stats/public")
def public_stats(db: Session = Depends(get_db)):
    """Aggregate counts for landing page (no auth)."""
    total = db.query(Complaint).count()
    status_rows = db.query(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status).all()

    def _status_key(s):
        if s is None:
            return "unknown"
        return getattr(s, "value", str(s))

    by_status = {_status_key(s): c for s, c in status_rows}
    return {
        "total_complaints": total,
        "resolved": by_status.get("resolved", 0),
        "pending": by_status.get("pending", 0),
        "submitted": by_status.get("submitted", 0),
        "acknowledged": by_status.get("acknowledged", 0),
        "escalated": by_status.get("escalated", 0),
        "authorities_notified": sum(by_status.get(k, 0) for k in ("submitted", "acknowledged", "resolved", "escalated")),
    }
