# backend/app/crud.py
"""
CRUD operations for database models
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import List, Optional
from datetime import datetime, timedelta
from . import models, schemas, auth
from fastapi import HTTPException, status


# ==================== USER OPERATIONS ====================

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Get user by email"""
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    """Get user by ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Create a new user"""
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Log activity
    create_activity(db, user_id=db_user.id, activity_type="user_created", description="User account created")
    
    return db_user


def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> models.User:
    """Update user profile"""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_user)
    
    return db_user


def create_password_reset_token(db: Session, email: str) -> Optional[str]:
    """Generate and store password reset token"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    
    token = auth.create_reset_token()
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    
    db.commit()
    return token


def reset_password(db: Session, token: str, new_password: str) -> bool:
    """Reset user password using token"""
    user = auth.verify_reset_token(db, token)
    if not user:
        return False
    
    user.hashed_password = auth.get_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    
    db.commit()
    return True


# ==================== NOTE OPERATIONS ====================

def get_notes(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Note]:
    """Get all notes for a user"""
    return db.query(models.Note).filter(
        models.Note.user_id == user_id,
        models.Note.is_archived == False
    ).order_by(models.Note.updated_at.desc()).offset(skip).limit(limit).all()


def get_note_by_id(db: Session, note_id: int, user_id: int) -> Optional[models.Note]:
    """Get a specific note by ID"""
    return db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.user_id == user_id
    ).first()


def create_note(db: Session, note: schemas.NoteCreate, user_id: int) -> models.Note:
    """Create a new note"""
    db_note = models.Note(
        title=note.title,
        content=note.content,
        tags=note.tags,
        meta_data=note.meta_data,
        is_favorite=note.is_favorite,
        user_id=user_id,
        version=1
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    # Create initial version
    create_note_version(db, db_note)
    
    # Log activity
    create_activity(db, user_id=user_id, activity_type="note_created", 
                   description=f"Created note: {note.title}", note_id=db_note.id)
    
    return db_note


def update_note(db: Session, note_id: int, note_update: schemas.NoteUpdate, user_id: int) -> models.Note:
    """Update an existing note"""
    db_note = get_note_by_id(db, note_id, user_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Create version before updating
    create_note_version(db, db_note)
    
    # Update fields
    update_data = note_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_note, field, value)
    
    db_note.version += 1
    db_note.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_note)
    
    # Log activity
    create_activity(db, user_id=user_id, activity_type="note_updated",
                   description=f"Updated note: {db_note.title}", note_id=note_id)
    
    return db_note


def delete_note(db: Session, note_id: int, user_id: int) -> bool:
    """Delete a note"""
    db_note = get_note_by_id(db, note_id, user_id)
    if not db_note:
        return False
    
    db.delete(db_note)
    db.commit()
    
    # Log activity
    create_activity(db, user_id=user_id, activity_type="note_deleted",
                   description=f"Deleted note: {db_note.title}")
    
    return True


def search_notes(db: Session, user_id: int, search_params: schemas.NoteSearch) -> List[models.Note]:
    """Search and filter notes"""
    query = db.query(models.Note).filter(models.Note.user_id == user_id)
    
    # Text search
    if search_params.query:
        search_term = f"%{search_params.query}%"
        query = query.filter(
            or_(
                models.Note.title.ilike(search_term),
                models.Note.content.ilike(search_term)
            )
        )
    
    # Filter by tags
    if search_params.tags:
        query = query.filter(models.Note.tags.overlap(search_params.tags))
    
    # Filter by favorite
    if search_params.is_favorite is not None:
        query = query.filter(models.Note.is_favorite == search_params.is_favorite)
    
    # Filter by archived
    if search_params.is_archived is not None:
        query = query.filter(models.Note.is_archived == search_params.is_archived)
    
    # Date range
    if search_params.date_from:
        query = query.filter(models.Note.created_at >= search_params.date_from)
    if search_params.date_to:
        query = query.filter(models.Note.created_at <= search_params.date_to)
    
    # Order and paginate
    query = query.order_by(models.Note.updated_at.desc())
    query = query.offset(search_params.offset).limit(search_params.limit)
    
    return query.all()


# ==================== NOTE VERSION OPERATIONS ====================

def create_note_version(db: Session, note: models.Note) -> models.NoteVersion:
    """Create a version snapshot of a note"""
    version = models.NoteVersion(
        version_number=note.version,
        title=note.title,
        content=note.content,
        tags=note.tags,
        meta_data=note.meta_data,
        note_id=note.id
    )
    db.add(version)
    db.commit()
    return version


def get_note_versions(db: Session, note_id: int, user_id: int) -> List[models.NoteVersion]:
    """Get all versions of a note"""
    # Verify note ownership
    note = get_note_by_id(db, note_id, user_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return db.query(models.NoteVersion).filter(
        models.NoteVersion.note_id == note_id
    ).order_by(models.NoteVersion.created_at.desc()).all()


# ==================== FILE OPERATIONS ====================

def create_file_attachment(
    db: Session,
    note_id: int,
    user_id: int,
    filename: str,
    original_filename: str,
    file_type: str,
    file_size: int,
    file_data: bytes,
    thumbnail_data: Optional[bytes] = None,
    meta_data: dict = {}
) -> models.FileAttachment:
    """Create a file attachment for a note"""
    # Verify note ownership
    note = get_note_by_id(db, note_id, user_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    file_attachment = models.FileAttachment(
        filename=filename,
        original_filename=original_filename,
        file_type=file_type,
        file_size=file_size,
        file_data=file_data,
        thumbnail_data=thumbnail_data,
        meta_data=meta_data,
        note_id=note_id
    )
    
    db.add(file_attachment)
    db.commit()
    db.refresh(file_attachment)
    
    # Log activity
    create_activity(db, user_id=user_id, activity_type="file_uploaded",
                   description=f"Uploaded file: {original_filename}", note_id=note_id)
    
    return file_attachment


def get_file_attachment(db: Session, file_id: int, user_id: int) -> Optional[models.FileAttachment]:
    """Get a file attachment with ownership verification"""
    file_attachment = db.query(models.FileAttachment).filter(
        models.FileAttachment.id == file_id
    ).first()
    
    if not file_attachment:
        return None
    
    # Verify ownership through note
    note = get_note_by_id(db, file_attachment.note_id, user_id)
    if not note:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return file_attachment


def delete_file_attachment(db: Session, file_id: int, user_id: int) -> bool:
    """Delete a file attachment"""
    file_attachment = get_file_attachment(db, file_id, user_id)
    if not file_attachment:
        return False
    
    db.delete(file_attachment)
    db.commit()
    
    return True


# ==================== SHARED LINK OPERATIONS ====================

def create_shared_link(
    db: Session,
    note_id: int,
    user_id: int,
    expires_at: Optional[datetime] = None,
    password: Optional[str] = None
) -> models.SharedLink:
    """Create a shareable link for a note"""
    # Verify note ownership
    note = get_note_by_id(db, note_id, user_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    password_hash = auth.get_password_hash(password) if password else None
    
    shared_link = models.SharedLink(
        note_id=note_id,
        expires_at=expires_at,
        password_hash=password_hash
    )
    
    db.add(shared_link)
    db.commit()
    db.refresh(shared_link)
    
    # Log activity
    create_activity(db, user_id=user_id, activity_type="note_shared",
                   description=f"Created share link for: {note.title}", note_id=note_id)
    
    return shared_link


def get_shared_note(db: Session, token: str, password: Optional[str] = None) -> Optional[models.Note]:
    """Access a shared note using token"""
    shared_link = db.query(models.SharedLink).filter(
        models.SharedLink.token == token,
        models.SharedLink.is_active == True
    ).first()
    
    if not shared_link:
        return None
    
    # Check expiry
    if shared_link.expires_at and shared_link.expires_at < datetime.utcnow():
        return None
    
    # Check password
    if shared_link.password_hash:
        if not password or not auth.verify_password(password, shared_link.password_hash):
            raise HTTPException(status_code=401, detail="Invalid password")
    
    # Update analytics
    shared_link.view_count += 1
    shared_link.last_viewed_at = datetime.utcnow()
    db.commit()
    
    # Get note with files
    note = db.query(models.Note).filter(models.Note.id == shared_link.note_id).first()
    return note


def get_shared_links_for_note(db: Session, note_id: int, user_id: int) -> List[models.SharedLink]:
    """Get all shared links for a note"""
    # Verify note ownership
    note = get_note_by_id(db, note_id, user_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return db.query(models.SharedLink).filter(
        models.SharedLink.note_id == note_id
    ).order_by(models.SharedLink.created_at.desc()).all()


def deactivate_shared_link(db: Session, link_id: int, user_id: int) -> bool:
    """Deactivate a shared link"""
    shared_link = db.query(models.SharedLink).filter(models.SharedLink.id == link_id).first()
    if not shared_link:
        return False
    
    # Verify ownership
    note = get_note_by_id(db, shared_link.note_id, user_id)
    if not note:
        raise HTTPException(status_code=403, detail="Access denied")
    
    shared_link.is_active = False
    db.commit()
    
    return True


# ==================== ACTIVITY & ANALYTICS OPERATIONS ====================

def create_activity(
    db: Session,
    user_id: int,
    activity_type: str,
    description: Optional[str] = None,
    note_id: Optional[int] = None,
    meta_data: dict = {}
) -> models.UserActivity:
    """Log user activity"""
    activity = models.UserActivity(
        user_id=user_id,
        activity_type=activity_type,
        description=description,
        note_id=note_id,
        meta_data=meta_data
    )
    
    db.add(activity)
    db.commit()
    
    return activity


def get_analytics(db: Session, user_id: int) -> dict:
    """Get analytics data for user dashboard"""
    # Total notes
    total_notes = db.query(func.count(models.Note.id)).filter(
        models.Note.user_id == user_id
    ).scalar()
    
    # Notes created this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    notes_this_week = db.query(func.count(models.Note.id)).filter(
        models.Note.user_id == user_id,
        models.Note.created_at >= week_ago
    ).scalar()
    
    # Total files
    total_files = db.query(func.count(models.FileAttachment.id)).join(
        models.Note
    ).filter(models.Note.user_id == user_id).scalar()
    
    # Total shared links
    total_shared = db.query(func.count(models.SharedLink.id)).join(
        models.Note
    ).filter(
        models.Note.user_id == user_id,
        models.SharedLink.is_active == True
    ).scalar()
    
    # AI operations count
    ai_operations_count = db.query(func.count(models.UserActivity.id)).filter(
        models.UserActivity.user_id == user_id,
        models.UserActivity.activity_type.like("ai_%")
    ).scalar()
    
    # Recent activities (last 10)
    recent_activities = db.query(models.UserActivity).filter(
        models.UserActivity.user_id == user_id
    ).order_by(models.UserActivity.created_at.desc()).limit(10).all()
    
    recent_activities_data = [
        {
            "type": activity.activity_type,
            "description": activity.description,
            "created_at": activity.created_at.isoformat()
        }
        for activity in recent_activities
    ]
    
    # Notes by tag
    notes = db.query(models.Note).filter(models.Note.user_id == user_id).all()
    notes_by_tag = {}
    for note in notes:
        for tag in note.tags:
            notes_by_tag[tag] = notes_by_tag.get(tag, 0) + 1
    
    # Activity timeline (last 7 days)
    activity_timeline = []
    for i in range(7):
        date = datetime.utcnow() - timedelta(days=i)
        date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        date_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        count = db.query(func.count(models.UserActivity.id)).filter(
            models.UserActivity.user_id == user_id,
            models.UserActivity.created_at >= date_start,
            models.UserActivity.created_at <= date_end
        ).scalar()
        
        activity_timeline.append({
            "date": date_start.strftime("%Y-%m-%d"),
            "count": count
        })
    
    activity_timeline.reverse()
    
    return {
        "total_notes": total_notes,
        "notes_this_week": notes_this_week,
        "total_files": total_files,
        "total_shared": total_shared,
        "ai_operations_count": ai_operations_count,
        "recent_activities": recent_activities_data,
        "notes_by_tag": notes_by_tag,
        "activity_timeline": activity_timeline
    }


# ==================== CHAT OPERATIONS ====================

def create_chat_session(db: Session, user_id: int) -> models.ChatSession:
    """Create a new chat session"""
    db_session = models.ChatSession(user_id=user_id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def get_chat_session(db: Session, chat_id: str, user_id: int) -> Optional[models.ChatSession]:
    """Get a chat session with ownership verification"""
    return db.query(models.ChatSession).filter(
        models.ChatSession.id == chat_id,
        models.ChatSession.user_id == user_id
    ).first()


def get_chat_sessions(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> List[models.ChatSession]:
    """Get all chat sessions for a user"""
    return db.query(models.ChatSession).filter(
        models.ChatSession.user_id == user_id
    ).order_by(models.ChatSession.created_at.desc()).offset(skip).limit(limit).all()


def create_chat_message(db: Session, chat_id: str, role: str, content: str) -> models.ChatMessage:
    """Add a message to a chat session"""
    db_message = models.ChatMessage(
        chat_id=chat_id,
        role=role,
        content=content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


def get_chat_messages(db: Session, chat_id: str, user_id: int, limit: int = 50) -> List[models.ChatMessage]:
    """Get messages for a chat session with ownership verification"""
    # Verify session ownership
    session = get_chat_session(db, chat_id, user_id)
    if not session:
        return []
        
    return db.query(models.ChatMessage).filter(
        models.ChatMessage.chat_id == chat_id
    ).order_by(models.ChatMessage.created_at.asc()).limit(limit).all()
