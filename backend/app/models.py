# backend/app/models.py
"""
SQLAlchemy models for NoteAI Pro with PostgreSQL BYTEA file storage
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, LargeBinary, JSON, ARRAY
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime
import secrets
import uuid


class User(Base):
    """User model with authentication and profile data"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    
    # Password reset
    reset_token = Column(String(100), nullable=True, index=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("UserActivity", back_populates="user", cascade="all, delete-orphan")


class Note(Base):
    """Note model with rich content, tags, and metadata"""
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    content = Column(Text, nullable=True)  # Rich text content (HTML or Markdown)
    
    # AI-generated tags (stored as array in PostgreSQL, JSON in SQLite)
    tags = Column(JSON, default=list)
    
    # Metadata as JSON (color, icon, category, etc.)
    meta_data = Column(JSON, default=dict)
    
    # Search optimization
    search_vector = Column(Text, nullable=True)  # For full-text search
    
    # Flags
    is_favorite = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    
    # Privacy features
    is_hidden = Column(Boolean, default=False)  # Hide note from main view
    is_locked = Column(Boolean, default=False)  # Lock note with PIN
    lock_pin_hash = Column(String(255), nullable=True)  # Hashed PIN for locked notes
    
    # Version tracking
    version = Column(Integer, default=1)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notes")
    files = relationship("FileAttachment", back_populates="note", cascade="all, delete-orphan")
    versions = relationship("NoteVersion", back_populates="note", cascade="all, delete-orphan")
    shared_links = relationship("SharedLink", back_populates="note", cascade="all, delete-orphan")


class FileAttachment(Base):
    """File attachments stored in PostgreSQL using BYTEA"""
    __tablename__ = "file_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=False)  # MIME type
    file_size = Column(Integer, nullable=False)  # Size in bytes
    
    # File data stored in database (BYTEA column)
    file_data = Column(LargeBinary, nullable=False)
    
    # Thumbnail for images/videos (optional)
    thumbnail_data = Column(LargeBinary, nullable=True)
    
    # Metadata
    meta_data = Column(JSON, default=dict)  # width, height, duration, etc.
    
    # Foreign keys
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    note = relationship("Note", back_populates="files")


class NoteVersion(Base):
    """Version history for notes"""
    __tablename__ = "note_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    version_number = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    meta_data = Column(JSON, default=dict)
    
    # Foreign keys
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    note = relationship("Note", back_populates="versions")


class SharedLink(Base):
    """Shareable links for notes with expiry"""
    __tablename__ = "shared_links"
    
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(100), unique=True, index=True, nullable=False, default=lambda: secrets.token_urlsafe(32))
    
    # Access control
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    password_hash = Column(String(255), nullable=True)  # Optional password protection
    
    # Analytics
    view_count = Column(Integer, default=0)
    last_viewed_at = Column(DateTime, nullable=True)
    
    # Foreign keys
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    note = relationship("Note", back_populates="shared_links")


class UserActivity(Base):
    """User activity logs for analytics"""
    __tablename__ = "user_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    activity_type = Column(String(50), nullable=False, index=True)  # note_created, note_viewed, ai_used, etc.
    description = Column(String(500), nullable=True)
    meta_data = Column(JSON, default=dict)  # Additional context
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="activities")


class ChatSession(Base):
    """Chat session for conversation memory"""
    __tablename__ = "chat_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    """Individual message in a chat session"""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
