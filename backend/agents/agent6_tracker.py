import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Complaint
from utils.admin_notify import _strip_wrappers
from utils.notifications import send_email

def run(db: Session):
    """
    This function should be run periodically (e.g. by APScheduler).
    Finds complaints stuck in 'submitted' for > 72 hours and escalates them.
    """
    print("Agent 6: Status Tracker & Escalation")
    escalation_threshold = datetime.utcnow() - timedelta(hours=72)
    
    stuck_complaints = db.query(Complaint).filter(
        Complaint.status == 'submitted',
        Complaint.created_at <= escalation_threshold
    ).all()
    
    admin_inbox = _strip_wrappers(os.getenv("ADMIN_NOTIFY_EMAIL", ""))
    for complaint in stuck_complaints:
        complaint.status = 'escalated'

        if admin_inbox:
            submitter = (
                f"{complaint.user.full_name} <{complaint.user.email}>"
                if complaint.user
                else "(unknown)"
            )
            send_email(
                admin_inbox,
                f"[AWAZ] Escalated report #{complaint.id}",
                f"Report #{complaint.id} was in 'submitted' for over 72 hours and is now marked escalated.\n\n"
                f"Submitter: {submitter}\n"
                f"Title: {complaint.title or '(none)'}\n"
                f"Category: {getattr(complaint.category, 'value', complaint.category)}\n",
            )

    if stuck_complaints:
        db.commit()
        
    return len(stuck_complaints)
