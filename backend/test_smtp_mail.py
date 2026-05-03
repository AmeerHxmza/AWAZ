"""
Test Gmail SMTP from your .env without filing a report.

Run from the backend folder:
  python test_smtp_mail.py
"""
from dotenv import load_dotenv

load_dotenv()

from utils.admin_notify import send_smtp_email, _smtp_user
import os


def main() -> None:
    to_addr = (os.getenv("ADMIN_NOTIFY_EMAIL") or "").strip()
    if not to_addr:
        print("Set ADMIN_NOTIFY_EMAIL in .env first.")
        return
    user = _smtp_user()
    print(f"Sending test mail FROM {user} TO {to_addr} …")
    send_smtp_email(to_addr, "[AWAZ] SMTP test", "If you see this, SMTP is configured correctly.")
    print("Success — check the inbox (and spam).")


if __name__ == "__main__":
    main()
