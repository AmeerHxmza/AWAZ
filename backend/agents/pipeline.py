from sqlalchemy.orm import Session, joinedload

from database import SessionLocal
from models import Complaint, Notification
from agents import agent1_intake
from agents import agent2_rag
from agents import agent3_drafter
from agents import agent5_router
from agents import agent4_geo


def _log_notification(
    db: Session,
    complaint_id: int,
    channel: str,
    recipient: str,
    ok: bool,
):
    if not recipient:
        return
    db.add(
        Notification(
            complaint_id=complaint_id,
            channel=channel,
            recipient=recipient,
            status="sent" if ok else "failed",
        )
    )


def process_complaint_pipeline(complaint_id: int):
    """Run agents in a fresh DB session (required for FastAPI BackgroundTasks)."""
    print(f"Starting pipeline for complaint ID {complaint_id}")
    db = SessionLocal()
    try:
        complaint = (
            db.query(Complaint)
            .options(joinedload(Complaint.user))
            .filter(Complaint.id == complaint_id)
            .first()
        )
        if not complaint:
            print("Complaint not found.")
            return

        intake_data = agent1_intake.run(complaint.description or "")
        complaint.category = intake_data.get("category", "other")

        context = agent2_rag.run(complaint.category, intake_data.get("keywords", ""))

        drafts = agent3_drafter.run(complaint.description or "", context)
        complaint.drafted_letter = (drafts.get("letter_english", "") or "") + "\n\n" + (
            drafts.get("letter_urdu", "") or ""
        )

        user_email = complaint.user.email if complaint.user else ""
        cat = complaint.category
        if hasattr(cat, "value"):
            cat = cat.value
        routing_data = agent5_router.run(
            category=str(cat or "other"),
            location_info=f"{complaint.latitude}, {complaint.longitude}",
            drafted_letter_eng=drafts.get("letter_english", "") or "",
            user_email=user_email,
            complaint_id=complaint.id,
            title=complaint.title or "",
            description=complaint.description or "",
            submitter_name=complaint.user.full_name if complaint.user else "",
        )
        complaint.authority = routing_data["authority"]
        complaint.authority_email = routing_data["authority_email"]
        complaint.status = "submitted"

        admin_inbox = routing_data.get("admin_notify_recipient") or ""
        if admin_inbox:
            _log_notification(
                db,
                complaint.id,
                "email",
                admin_inbox,
                routing_data.get("admin_notify_ok", False),
            )

        db.commit()

        all_complaints = db.query(Complaint).all()
        agent4_geo.run(all_complaints)
        print(f"Pipeline completed for complaint ID {complaint_id}")
    except Exception as e:
        db.rollback()
        print(f"Pipeline failed for complaint ID {complaint_id}: {e}")
    finally:
        db.close()
