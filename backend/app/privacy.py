# backend/app/privacy.py
"""
Privacy features for notes - locking and hiding functionality
"""
from passlib.context import CryptContext
from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.app import models, schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_pin(pin: str) -> str:
    """Hash a PIN for secure storage"""
    return pwd_context.hash(pin)


def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """Verify a PIN against its hash"""
    return pwd_context.verify(plain_pin, hashed_pin)


async def lock_note(note_id: int, pin: str, db: Session, user_id: int):
    """Lock a note with a PIN"""
    note = db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.user_id == user_id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if note.is_locked:
        raise HTTPException(status_code=400, detail="Note is already locked")
    
    note.is_locked = True
    note.lock_pin_hash = hash_pin(pin)
    db.commit()
    
    return {"success": True, "message": "Note locked successfully"}


async def unlock_note(note_id: int, pin: str, db: Session, user_id: int):
    """Unlock a note with the correct PIN"""
    note = db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.user_id == user_id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if not note.is_locked:
        raise HTTPException(status_code=400, detail="Note is not locked")
    
    if not note.lock_pin_hash:
        raise HTTPException(status_code=500, detail="Lock PIN hash not found")
    
    if not verify_pin(pin, note.lock_pin_hash):
        raise HTTPException(status_code=401, detail="Incorrect PIN")
    
    note.is_locked = False
    note.lock_pin_hash = None
    db.commit()
    
    return {"success": True, "message": "Note unlocked successfully"}


async def toggle_hide_note(note_id: int, db: Session, user_id: int):
    """Toggle the hidden status of a note"""
    note = db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.user_id == user_id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    note.is_hidden = not note.is_hidden
    db.commit()
    
    status = "hidden" if note.is_hidden else "visible"
    return {"success": True, "message": f"Note is now {status}"}
