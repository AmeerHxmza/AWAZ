from sqlalchemy import Boolean, Column, Integer, String, Enum, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum('user', 'admin', name='user_roles'), default='user')
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    complaints = relationship("Complaint", back_populates="user")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, index=True)
    description = Column(Text)
    category = Column(Enum('water', 'road', 'garbage', 'sewage', 'other', name='complaint_categories'))
    status = Column(Enum('pending', 'submitted', 'acknowledged', 'resolved', 'escalated', name='complaint_statuses'), default='pending')
    authority = Column(String, nullable=True)
    authority_email = Column(String, nullable=True)
    drafted_letter = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    photo_url = Column(String, nullable=True)
    is_voice_input = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="complaints")
    notifications = relationship(
        "Notification",
        back_populates="complaint",
        cascade="all, delete-orphan",
    )

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    channel = Column(Enum('email', 'sms', name='notification_channels'))
    recipient = Column(String)
    status = Column(Enum('sent', 'failed', name='notification_statuses'))
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)

    complaint = relationship("Complaint", back_populates="notifications")
