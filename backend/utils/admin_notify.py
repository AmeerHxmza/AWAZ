"""
Send admin alerts via Gmail (or any SMTP server) when a citizen files a new report.

Gmail (free): use a Google Account with 2-Step Verification and create an App Password:
https://myaccount.google.com/apppasswords

Set in .env:
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your.sender@gmail.com
  SMTP_PASS=xxxx xxxx xxxx xxxx   (16-char app password, spaces optional)
  ADMIN_NOTIFY_EMAIL=admin.inbox@gmail.com   (required — sole inbox for report & escalation emails)

Routed complaints: the processing pipeline emails this address only (authorities and citizens are not emailed).
"""

from __future__ import annotations

import os
import smtplib
import ssl
from email.message import EmailMessage
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.orm import Session, joinedload

from database import SessionLocal
from models import Complaint, Notification

# Ensure .env is loaded (background tasks / alternate import order)
_dotenv_path = Path(__file__).resolve().parent.parent / ".env"
if _dotenv_path.is_file():
    load_dotenv(_dotenv_path)


def _strip_wrappers(val: str) -> str:
    s = (val or "").strip()
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "\"'":
        s = s[1:-1].strip()
    if s.endswith(";"):
        s = s[:-1].strip()
    return s


def _smtp_user() -> str:
    return _strip_wrappers(os.getenv("SMTP_USER", ""))


def _smtp_pass() -> str:
    # App passwords: remove spaces; strip accidental quotes
    return _strip_wrappers(os.getenv("SMTP_PASS", "")).replace(" ", "").replace("\n", "")


def _smtp_config_ok() -> bool:
    return bool(_smtp_user() and _smtp_pass())


def send_smtp_email(to_addr: str, subject: str, body: str) -> None:
    if not _smtp_config_ok():
        raise RuntimeError("SMTP_USER and SMTP_PASS are not set or empty after trimming")

    host = _strip_wrappers(os.getenv("SMTP_HOST", "smtp.gmail.com"))
    port = int(os.getenv("SMTP_PORT", "587"))
    user = _smtp_user()
    password = _smtp_pass()
    to_addr = _strip_wrappers(to_addr)

    if len(password) != 16:
        print(
            f"WARNING: SMTP_PASS length is {len(password)} (Gmail app passwords are usually 16 characters). "
            "Check for typos or extra characters in .env."
        )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = user
    msg["To"] = to_addr
    msg.set_content(body)

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP(host, port, timeout=30) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(user, password)
            server.send_message(msg)
    except smtplib.SMTPAuthenticationError as e:
        raise RuntimeError(
            "Gmail rejected the login. Use the 16-character App Password (not your normal password), "
            "and SMTP_USER must be the same Google account that created the app password. "
            f"Details: {e.smtp_code} {e.smtp_error.decode(errors='replace') if e.smtp_error else e}"
        ) from e
    except OSError as e:
        raise RuntimeError(
            f"Could not reach {host}:{port} ({e}). Check firewall/VPN or try another network."
        ) from e


def _log(db: Session, complaint_id: int, recipient: str, ok: bool) -> None:
    if not recipient:
        return
    db.add(
        Notification(
            complaint_id=complaint_id,
            channel="email",
            recipient=recipient,
            status="sent" if ok else "failed",
        )
    )


def _category_str(c) -> str:
    if c is None:
        return "(not set yet)"
    return getattr(c, "value", str(c))


def notify_admin_new_complaint(complaint_id: int) -> None:
    """
    Background task: email ADMIN_NOTIFY_EMAIL with report summary.
    Safe to call without SMTP configured (no-op with log line).
    """
    admin_inbox = _strip_wrappers(os.getenv("ADMIN_NOTIFY_EMAIL", ""))
    if not admin_inbox:
        print(
            "ADMIN_NOTIFY_EMAIL is empty — no admin email sent. "
            "Set it in backend/.env to the Gmail inbox that should receive new-report alerts."
        )
        return

    db = SessionLocal()
    try:
        complaint = (
            db.query(Complaint)
            .options(joinedload(Complaint.user))
            .filter(Complaint.id == complaint_id)
            .first()
        )
        if not complaint:
            print(f"notify_admin_new_complaint: complaint {complaint_id} not found")
            return

        user = complaint.user
        name = user.full_name if user else "?"
        email = user.email if user else "?"

        desc = (complaint.description or "").strip()
        preview = desc[:2000] + ("…" if len(desc) > 2000 else "")

        subject = f"[AWAZ] New report #{complaint_id}"
        body = (
            f"A new civic report was filed.\n\n"
            f"Report ID: {complaint_id}\n"
            f"From: {name} <{email}>\n"
            f"Title: {complaint.title or '(none)'}\n"
            f"Category: {_category_str(complaint.category)}\n"
            f"Status: {getattr(complaint.status, 'value', complaint.status)}\n"
            f"Location: {complaint.latitude}, {complaint.longitude}\n\n"
            f"Description:\n{preview or '(empty)'}\n"
        )

        try:
            send_smtp_email(admin_inbox, subject, body)
            print(f"Admin notify email sent for complaint {complaint_id} → {admin_inbox}")
            _log(db, complaint_id, admin_inbox, True)
            db.commit()
        except Exception as e:
            print(f"Admin notify email failed for complaint {complaint_id}: {e}")
            _log(db, complaint_id, admin_inbox, False)
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"notify_admin_new_complaint error: {e}")
    finally:
        db.close()
