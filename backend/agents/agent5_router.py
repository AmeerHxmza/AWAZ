import os
from typing import Optional

from utils.admin_notify import _strip_wrappers
from utils.notifications import send_email


def run(
    category: str,
    location_info: str,
    drafted_letter_eng: str,
    user_email: str,
    *,
    complaint_id: Optional[int] = None,
    title: str = "",
    description: str = "",
    submitter_name: str = "",
) -> dict:
    """Resolve intended authority (stored on the complaint) and email the admin inbox only."""
    print("Agent 5: Authority Router & admin notifier")

    authority_map = {
        "water": ("WASA Islamabad", "wasa@example.com"),
        "sewage": ("WASA Islamabad", "wasa@example.com"),
        "road": ("CDA Islamabad", "cda@example.com"),
        "garbage": ("Local Government", "lg@example.com"),
        "other": ("General Civic Authority", "info@example.com"),
    }

    authority, authority_email = authority_map.get(category, authority_map["other"])

    admin_inbox = _strip_wrappers(os.getenv("ADMIN_NOTIFY_EMAIL", ""))
    id_line = f"Report ID: {complaint_id}\n" if complaint_id is not None else ""
    subject = f"[AWAZ] Routed report #{complaint_id}" if complaint_id is not None else "[AWAZ] Routed report"
    body = (
        f"{id_line}"
        f"Submitter: {submitter_name or '(unknown)'} <{user_email or '(none)'}>\n"
        f"Title: {title or '(none)'}\n"
        f"Category: {category}\n"
        f"Location / coordinates: {location_info}\n\n"
        f"Intended authority (not emailed automatically): {authority} <{authority_email}>\n\n"
        f"Description:\n{description or '(empty)'}\n\n"
        f"--- Draft letter (English) ---\n{drafted_letter_eng or '(none)'}\n"
    )

    admin_notify_ok = False
    if not admin_inbox:
        print(
            "ADMIN_NOTIFY_EMAIL is empty — no pipeline summary email sent. "
            "Set it in backend/.env."
        )
    else:
        admin_notify_ok = send_email(admin_inbox, subject, body)

    return {
        "authority": authority,
        "authority_email": authority_email,
        "admin_notify_recipient": admin_inbox,
        "admin_notify_ok": admin_notify_ok,
    }
