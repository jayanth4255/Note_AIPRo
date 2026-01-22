# backend/app/main.py
# Triggering reload...
"""
NoteAI Pro - FastAPI Main Application
Production-ready REST API with comprehensive features
"""
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from io import BytesIO
from .database import get_db, engine, Base
from .config import get_settings
from . import models, schemas, crud, auth, ai_integration, file_handler, pdf_export

# Create database tables
Base.metadata.create_all(bind=engine)

# Get settings
settings = get_settings()

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Production-ready note-taking application with AI features",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)


# CORS Configuration - Allow ALL origins for debugging
ALLOWED_ORIGINS = ["*"]

print("LOADING CORS CONFIGURATION: ALLOWING ALL ORIGINS")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== HEALTH CHECK ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "message": "Welcome to NoteAI Pro API This uses ai in the backend",
        "timestamp": datetime.utcnow().isoformat()
    }


# ==================== AUTHENTICATION ROUTES ====================

@app.post("/api/auth/signup", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
async def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    existing_user = crud.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    db_user = crud.create_user(db, user)
    
    # Generate token
    access_token = auth.create_access_token({"user_id": db_user.id})
    
    # Update last login
    db_user.last_login = datetime.utcnow()
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }


@app.post("/api/auth/login", response_model=schemas.Token)
async def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    # Get user
    db_user = crud.get_user_by_email(db, user.email)
    
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate token
    access_token = auth.create_access_token({"user_id": db_user.id})
    
    # Update last login
    db_user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(db_user)
    
    # Log activity
    crud.create_activity(db, user_id=db_user.id, activity_type="login", description="User logged in")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }


@app.post("/api/auth/forgot-password")
async def forgot_password(request: schemas.PasswordReset, db: Session = Depends(get_db)):
    """Request password reset"""
    token = crud.create_password_reset_token(db, request.email)
    
    if token:
        # In production, send email with reset link
        # For now, return the token (NOT SECURE FOR PRODUCTION)
        return {
            "message": "Password reset instructions sent to email",
            "reset_token": token if settings.DEBUG else None
        }
    
    # Always return success to prevent email enumeration
    return {"message": "If the email exists, password reset instructions have been sent"}


@app.post("/api/auth/reset-password")
async def reset_password(request: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    """Reset password using token"""
    success = crud.reset_password(db, request.token, request.new_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    return {"message": "Password reset successful"}


@app.get("/api/auth/me", response_model=schemas.UserOut)
async def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    """Get current authenticated user info"""
    return current_user


@app.put("/api/auth/me", response_model=schemas.UserOut)
async def update_current_user(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    updated_user = crud.update_user(db, current_user.id, user_update)
    return updated_user


@app.post("/api/auth/change-password")
async def change_password(
    current_password: str = Form(...),
    new_password: str = Form(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Verify current password
    if not auth.verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.hashed_password = auth.get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


# ==================== NOTES ROUTES ====================

@app.get("/api/notes", response_model=List[schemas.NoteOut])
async def get_notes(
    skip: int = 0,
    limit: int = 100,
    archived: bool = False,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all notes for current user"""
    notes = crud.get_notes(db, current_user.id, skip, limit, archived)
    return notes


@app.post("/api/notes", response_model=schemas.NoteOut, status_code=status.HTTP_201_CREATED)
async def create_note(
    note: schemas.NoteCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new note with AI-powered auto-tagging and category detection"""
    db_note = crud.create_note(db, note, current_user.id)
    
    # Auto-generate tags and category if content is provided
    if db_note.content:
        try:
            # Auto-generate tags if not provided
            if not db_note.tags:
                tags = await ai_integration.ai_generate_tags(db_note.content)
                db_note.tags = tags
                crud.create_activity(db, user_id=current_user.id, activity_type="ai_auto_tag",
                                   description=f"Auto-generated tags for: {db_note.title}", note_id=db_note.id)
            
            # Auto-detect category
            if not db_note.meta_data.get("category"):
                category = await ai_integration.ai_detect_category(db_note.content)
                db_note.meta_data = {**db_note.meta_data, "category": category}
                crud.create_activity(db, user_id=current_user.id, activity_type="ai_auto_category",
                                   description=f"Auto-detected category: {category}", note_id=db_note.id)
            
            db.commit()
            db.refresh(db_note)
        except Exception:
            pass  # Fail silently if AI processing fails
    
    return db_note


@app.get("/api/notes/{note_id}", response_model=schemas.NoteOut)
async def get_note(
    note_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific note"""
    note = crud.get_note_by_id(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Log activity
    crud.create_activity(db, user_id=current_user.id, activity_type="note_viewed",
                       description=f"Viewed note: {note.title}", note_id=note_id)
    
    return note


@app.put("/api/notes/{note_id}", response_model=schemas.NoteOut)
async def update_note(
    note_id: int,
    note_update: schemas.NoteUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update a note with optional AI re-processing"""
    updated_note = crud.update_note(db, note_id, note_update, current_user.id)
    
    # Re-process tags and category if content changed significantly
    if note_update.content:
        try:
            # Regenerate tags if none exist or if content changed
            if not updated_note.tags or len(updated_note.tags) == 0:
                tags = await ai_integration.ai_generate_tags(updated_note.content)
                updated_note.tags = tags
            
            # Re-detect category
            category = await ai_integration.ai_detect_category(updated_note.content)
            updated_note.meta_data = {**updated_note.meta_data, "category": category}
            
            db.commit()
            db.refresh(updated_note)
        except Exception:
            pass  # Fail silently
    
    return updated_note



@app.delete("/api/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a note"""
    success = crud.delete_note(db, note_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/notes/{note_id}/archive", response_model=schemas.NoteOut)
async def archive_note(
    note_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Archive a note"""
    note = crud.archive_note(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@app.post("/api/notes/{note_id}/unarchive", response_model=schemas.NoteOut)
async def unarchive_note(
    note_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Unarchive a note"""
    note = crud.unarchive_note(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@app.post("/api/notes/search", response_model=List[schemas.NoteOut])
async def search_notes(
    search_params: schemas.NoteSearch,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Search and filter notes"""
    notes = crud.search_notes(db, current_user.id, search_params)
    return notes


# ==================== PRIVACY ROUTES ====================

@app.post("/api/notes/{note_id}/lock", response_model=schemas.PrivacyResponse)
async def lock_note(
    note_id: int,
    lock_request: schemas.NoteLockRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Lock a note with a PIN"""
    from .privacy import lock_note as lock_note_fn
    result = await lock_note_fn(note_id, lock_request.pin, db, current_user.id)
    return result


@app.post("/api/notes/{note_id}/unlock", response_model=schemas.PrivacyResponse)
async def unlock_note(
    note_id: int,
    unlock_request: schemas.NoteUnlockRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Unlock a note with the correct PIN"""
    from .privacy import unlock_note as unlock_note_fn
    result = await unlock_note_fn(note_id, unlock_request.pin, db, current_user.id)
    return result


@app.post("/api/notes/{note_id}/toggle-hide", response_model=schemas.PrivacyResponse)
async def toggle_hide_note(
    note_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle the hidden status of a note"""
    from .privacy import toggle_hide_note as toggle_hide_fn
    result = await toggle_hide_fn(note_id, db, current_user.id)
    return result


# ==================== NOTE VERSIONS ====================

@app.get("/api/notes/{note_id}/versions", response_model=List[schemas.NoteVersionOut])
async def get_note_versions(
    note_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get version history for a note"""
    versions = crud.get_note_versions(db, note_id, current_user.id)
    return versions


# ==================== FILE UPLOAD ROUTES ====================

@app.post("/api/notes/{note_id}/files", response_model=schemas.FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    note_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file attachment to a note"""
    # Process file upload
    unique_filename, file_data, thumbnail_data, metadata = await file_handler.process_upload(
        file, current_user.id
    )
    
    # Save to database
    file_attachment = crud.create_file_attachment(
        db=db,
        note_id=note_id,
        user_id=current_user.id,
        filename=unique_filename,
        original_filename=file.filename,
        file_type=file.content_type,
        file_size=len(file_data),
        file_data=file_data,
        thumbnail_data=thumbnail_data,
        meta_data=metadata
    )
    
    return {
        "file_id": file_attachment.id,
        "filename": file_attachment.filename,
        "file_type": file_attachment.file_type,
        "file_size": file_attachment.file_size,
        "message": "File uploaded successfully"
    }


@app.get("/api/files/{file_id}")
async def download_file(
    file_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Download a file attachment"""
    file_attachment = crud.get_file_attachment(db, file_id, current_user.id)
    
    if not file_attachment:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Return file as streaming response
    return StreamingResponse(
        BytesIO(file_attachment.file_data),
        media_type=file_attachment.file_type,
        headers={
            "Content-Disposition": f"attachment; filename={file_attachment.original_filename}"
        }
    )


@app.get("/api/files/{file_id}/thumbnail")
async def get_file_thumbnail(
    file_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get file thumbnail (for images)"""
    file_attachment = crud.get_file_attachment(db, file_id, current_user.id)
    
    if not file_attachment:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not file_attachment.thumbnail_data:
        raise HTTPException(status_code=404, detail="Thumbnail not available")
    
    return StreamingResponse(
        BytesIO(file_attachment.thumbnail_data),
        media_type="image/jpeg"
    )


@app.get("/api/files/{file_id}/content")
async def get_file_content(
    file_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get extracted text content and metadata for a file"""
    file_attachment = crud.get_file_attachment(db, file_id, current_user.id)
    
    if not file_attachment:
        raise HTTPException(status_code=404, detail="File not found")
        
    return {
        "id": file_attachment.id,
        "filename": file_attachment.original_filename,
        "file_type": file_attachment.file_type,
        "file_size": file_attachment.file_size,
        "extracted_text": file_attachment.meta_data.get("extracted_text"),
        "meta_data": file_attachment.meta_data,
        "created_at": file_attachment.created_at
    }


@app.delete("/api/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file attachment"""
    success = crud.delete_file_attachment(db, file_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="File not found")
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ==================== PDF EXPORT ====================

@app.get("/api/notes/{note_id}/export/pdf")
async def export_note_pdf(
    note_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Export note as PDF"""
    note = crud.get_note_by_id(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Generate PDF
    pdf_bytes = pdf_export.export_note_to_pdf(
        title=note.title,
        content=note.content,
        tags=note.tags,
        created_at=note.created_at,
        updated_at=note.updated_at,
        author_name=current_user.name
    )
    
    # Log activity
    crud.create_activity(db, user_id=current_user.id, activity_type="note_exported",
                       description=f"Exported note to PDF: {note.title}", note_id=note_id)
    
    # Return PDF
    filename = f"{note.title.replace(' ', '_')}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ==================== SHARING ROUTES ====================

@app.post("/api/notes/{note_id}/share", response_model=schemas.SharedLinkOut, status_code=status.HTTP_201_CREATED)
async def create_share_link(
    note_id: int,
    share_config: schemas.SharedLinkCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a shareable link for a note"""
    shared_link = crud.create_shared_link(
        db=db,
        note_id=note_id,
        user_id=current_user.id,
        expires_at=share_config.expires_at,
        password=share_config.password
    )
    
    return shared_link


@app.get("/api/notes/{note_id}/shares", response_model=List[schemas.SharedLinkOut])
async def get_share_links(
    note_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all share links for a note"""
    shares = crud.get_shared_links_for_note(db, note_id, current_user.id)
    return shares


@app.delete("/api/shares/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_share_link(
    link_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Deactivate a share link"""
    success = crud.deactivate_shared_link(db, link_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Share link not found")
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/shared/{token}", response_model=schemas.NoteOut)
async def access_shared_note(
    token: str,
    access_request: schemas.SharedNoteAccess,
    db: Session = Depends(get_db)
):
    """Access a shared note (no authentication required)"""
    note = crud.get_shared_note(db, token, access_request.password)
    
    if not note:
        raise HTTPException(status_code=404, detail="Shared note not found or expired")
    
    return note


# ==================== AI ROUTES ====================

@app.post("/api/ai/summarize", response_model=schemas.AIResponse)
async def ai_summarize_text(
    request: schemas.AIRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Summarize text using AI"""
    result = await ai_integration.ai_summarize(request.text, request.context)
    
    # Log activity
    crud.create_activity(db, user_id=current_user.id, activity_type="ai_summarize",
                       description="Used AI summarization")
    
    return {"result": result}


@app.post("/api/ai/rewrite", response_model=schemas.AIResponse)
async def ai_rewrite_text(
    request: schemas.AIRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Rewrite/improve text using AI"""
    result = await ai_integration.ai_rewrite(request.text, request.action)
    
    # Log activity
    crud.create_activity(db, user_id=current_user.id, activity_type="ai_rewrite",
                       description=f"Used AI rewrite ({request.action})")
    
    return {"result": result}


@app.post("/api/ai/generate")
async def ai_generate_note_content(
    topic: str = Form(...),
    length: str = Form("medium"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Auto-generate note content from topic"""
    result = await ai_integration.ai_generate_note(topic, length)
    
    # Log activity
    crud.create_activity(db, user_id=current_user.id, activity_type="ai_generate",
                       description=f"Generated note about: {topic}")
    
    return result


@app.post("/api/ai/image")
async def ai_generate_image_endpoint(
    request: schemas.AIImageRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate an image using AI"""
    image_bytes = await ai_integration.ai_generate_image(request.prompt, request.size, request.quality)
    
    # Log activity
    crud.create_activity(db, user_id=current_user.id, activity_type="ai_image",
                       description=f"Generated image: {request.prompt[:50]}")
    
    return StreamingResponse(
        BytesIO(image_bytes),
        media_type="image/png",
        headers={"Content-Disposition": "attachment; filename=ai_generated_image.png"}
    )


@app.post("/api/ai/tts")
async def ai_text_to_speech_endpoint(
    request: schemas.AITTSRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Convert text to speech"""
    audio_bytes = await ai_integration.ai_text_to_speech(request.text, request.voice)
    
    # Log activity
    crud.create_activity(db, user_id=current_user.id, activity_type="ai_tts",
                       description="Used text-to-speech")
    
    return StreamingResponse(
        BytesIO(audio_bytes),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "attachment; filename=speech.mp3"}
    )


@app.post("/api/ai/suggestions", response_model=schemas.AIResponse)
async def ai_get_suggestions_endpoint(
    request: schemas.AISuggestionRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI suggestions for text completion"""
    return {"result": suggestion}


@app.post("/api/ai/chat", response_model=schemas.AIResponse)
async def ai_chat_endpoint(
    request: schemas.AIRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with AI with session memory"""
    chat_id = request.chat_id
    
    # If no chat_id provided, we still allow stateless chat or reject depending on policy.
    # User requested: "When a new chat starts, generate a new chat_id."
    if not chat_id:
        session = crud.create_chat_session(db, current_user.id)
        chat_id = session.id
    
    # Verify session ownership if chat_id was provided
    else:
        session = crud.get_chat_session(db, chat_id, current_user.id)
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Fetch history
    history_objs = crud.get_chat_messages(db, chat_id, current_user.id)
    history = [{"role": msg.role, "content": msg.content} for msg in history_objs]
    
    # Save user message
    crud.create_chat_message(db, chat_id, "user", request.text)
    
    # Get AI response
    try:
        result = await ai_integration.ai_chat(request.text, history, request.context)
        
        # Save assistant message
        crud.create_chat_message(db, chat_id, "assistant", result)
        
        # Log activity
        crud.create_activity(db, user_id=current_user.id, activity_type="ai_chat",
                           description="Used AI chat session", meta_data={"chat_id": chat_id})
        
        return {"result": result, "chat_id": chat_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/chat/sessions", response_model=schemas.ChatSessionOut)
async def create_chat_session_endpoint(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat session"""
    return crud.create_chat_session(db, current_user.id)


@app.get("/api/ai/chat/sessions", response_model=List[schemas.ChatSessionOut])
async def list_chat_sessions(
    skip: int = 0,
    limit: int = 20,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """List recent chat sessions"""
    return crud.get_chat_sessions(db, current_user.id, skip, limit)


@app.get("/api/ai/chat/sessions/{chat_id}/messages", response_model=List[schemas.ChatMessageOut])
async def get_chat_session_history(
    chat_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get message history for a session"""
    messages = crud.get_chat_messages(db, chat_id, current_user.id)
    if not messages and not crud.get_chat_session(db, chat_id, current_user.id):
        raise HTTPException(status_code=404, detail="Chat session not found")
    return messages


@app.post("/api/ai/generate-text")
async def ai_generate_text_endpoint(
    prompt: str = Form(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate text content using AI"""
    try:
        # Use the existing summarize function but with generation prompt
        result = await ai_integration.ai_summarize(
            f"Generate content based on this prompt: {prompt}",
            None
        )
        
        # Log activity
        crud.create_activity(db, user_id=current_user.id, activity_type="ai_text_gen",
                           description=f"Generated text: {prompt[:50]}")
        
        return {"text": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/generate-image")
async def ai_generate_image_modal(
    prompt: str = Form(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate an image and return as base64"""
    try:
        # Generate image
        image_bytes = await ai_integration.ai_generate_image(prompt, "1024x1024", "standard")
        
        # Convert to base64
        import base64
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        image_url = f"data:image/png;base64,{image_b64}"
        
        # Log activity
        crud.create_activity(db, user_id=current_user.id, activity_type="ai_image_gen",
                           description=f"Generated image: {prompt[:50]}")
        
        return {"image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/generate-flowchart")
async def ai_generate_flowchart_endpoint(
    prompt: str = Form(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a Mermaid flowchart diagram"""
    try:
        # Use AI to generate Mermaid syntax
        flowchart_prompt = f"""Generate a Mermaid.js flowchart diagram for: {prompt}

Return ONLY the Mermaid code without any markdown code fences or explanations.
Start directly with 'flowchart' or 'graph'.

Example format:
flowchart TD
    A[Start] --> B[Process]
    B --> C[Decision]
    C -->|Yes| D[Action]
    C -->|No| E[End]"""
        
        result = await ai_integration.ai_summarize(flowchart_prompt, None)
        
        # Clean up the result
        mermaid_code = result.strip()
        if "```" in mermaid_code:
            # Extract code from markdown
            mermaid_code = mermaid_code.split("```")[1].strip()
            if mermaid_code.startswith("mermaid"):
                mermaid_code = mermaid_code[7:].strip()
        
        # Log activity
        crud.create_activity(db, user_id=current_user.id, activity_type="ai_flowchart",
                           description=f"Generated flowchart: {prompt[:50]}")
        
        return {"mermaid_code": mermaid_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== NEW AI INTELLIGENCE ENDPOINTS ====================

@app.post("/api/ai/format")
async def ai_format_text_endpoint(
    text: str = Form(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Auto-format messy text into clean markdown"""
    try:
        result = await ai_integration.ai_auto_format(text)
        crud.create_activity(db, user_id=current_user.id, activity_type="ai_format",
                           description="Auto-formatted text")
        return {"formatted_text": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/detect-category")
async def ai_detect_category_endpoint(
    text: str = Form(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Detect the category of text content"""
    try:
        category = await ai_integration.ai_detect_category(text)
        crud.create_activity(db, user_id=current_user.id, activity_type="ai_category",
                           description=f"Detected category: {category}")
        return {"category": category}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/extract-tasks")
async def ai_extract_tasks_endpoint(
    text: str = Form(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Extract tasks and deadlines from text"""
    try:
        tasks = await ai_integration.ai_extract_tasks(text)
        crud.create_activity(db, user_id=current_user.id, activity_type="ai_extract_tasks",
                           description=f"Extracted {len(tasks)} tasks")
        return {"tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/notes/{note_id}/tasks")
async def get_note_tasks(
    note_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Extract and return tasks from a specific note"""
    note = crud.get_note_by_id(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if not note.content:
        return {"tasks": []}
    
    try:
        tasks = await ai_integration.ai_extract_tasks(note.content)
        return {"note_id": note_id, "note_title": note.title, "tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/notes/{note_id}/related")
async def get_related_notes(
    note_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Find notes related to the specified note"""
    note = crud.get_note_by_id(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Get other notes
    all_notes = crud.get_notes(db, current_user.id, skip=0, limit=50)
    other_notes = [n for n in all_notes if n.id != note_id]
    
    if not other_notes:
        return {"related_notes": []}
    
    try:
        other_notes_data = [{"title": n.title, "content": n.content or ""} for n in other_notes]
        related_indices = await ai_integration.ai_find_related_notes(
            note.title + " " + (note.content or ""),
            other_notes_data
        )
        related_notes = [{"id": other_notes[i].id, "title": other_notes[i].title} for i in related_indices]
        return {"related_notes": related_notes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/ask-notes")
async def ai_ask_notes_endpoint(
    question: str = Form(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Answer a question based on the user's notes (Ask My Notes feature)"""
    # Fetch notes, excluding private ones
    notes = db.query(models.Note).filter(
        models.Note.user_id == current_user.id,
        models.Note.is_archived == False
    ).order_by(models.Note.updated_at.desc()).limit(30).all()
    
    # Filter out private notes from meta_data
    public_notes = [n for n in notes if not n.meta_data.get("is_private", False)]
    
    if not public_notes:
        return {"answer": "You don't have any notes yet. Create some notes first!"}
    
    # Build context from notes
    context_parts = []
    for n in public_notes[:20]:
        content_preview = (n.content or "")[:800]
        context_parts.append(f"=== Note: {n.title} ===\n{content_preview}")
    
    notes_context = "\n\n".join(context_parts)
    
    try:
        answer = await ai_integration.ai_ask_notes(question, notes_context)
        crud.create_activity(db, user_id=current_user.id, activity_type="ai_ask_notes",
                           description=f"Asked: {question[:50]}")
        return {"answer": answer, "notes_searched": len(public_notes)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/flashcards")
async def ai_generate_flashcards_endpoint(
    note_id: int = Form(...),
    count: int = Form(5),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate flashcards from a note for study mode"""
    note = crud.get_note_by_id(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if not note.content:
        return {"flashcards": []}
    
    try:
        flashcards = await ai_integration.ai_generate_flashcards(note.content, count)
        crud.create_activity(db, user_id=current_user.id, activity_type="ai_flashcards",
                           description=f"Generated {len(flashcards)} flashcards from: {note.title}")
        return {"note_title": note.title, "flashcards": flashcards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/daily-brief")
async def ai_daily_brief_endpoint(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a personalized daily brief"""
    # Get recent notes from last 7 days
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_notes = db.query(models.Note).filter(
        models.Note.user_id == current_user.id,
        models.Note.updated_at >= week_ago
    ).order_by(models.Note.updated_at.desc()).limit(10).all()
    
    # Extract tasks from recent notes
    all_tasks = []
    for note in recent_notes[:5]:
        if note.content:
            try:
                tasks = await ai_integration.ai_extract_tasks(note.content)
                all_tasks.extend(tasks)
            except:
                pass
    
    try:
        notes_data = [{"title": n.title} for n in recent_notes]
        brief = await ai_integration.ai_generate_daily_brief(notes_data, all_tasks)
        crud.create_activity(db, user_id=current_user.id, activity_type="ai_daily_brief",
                           description="Generated daily brief")
        return {"brief": brief, "recent_notes_count": len(recent_notes), "pending_tasks_count": len(all_tasks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/semantic-search")
async def ai_semantic_search_endpoint(
    query: str = Form(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Search notes using semantic expansion"""
    try:
        # Get expanded terms
        expanded_terms = await ai_integration.ai_expand_search_query(query)
        all_terms = [query] + expanded_terms
        
        # Search with all terms
        all_notes = crud.get_notes(db, current_user.id, skip=0, limit=100)
        
        # Score notes based on term matches
        scored_notes = []
        for note in all_notes:
            score = 0
            note_text = (note.title + " " + (note.content or "")).lower()
            for i, term in enumerate(all_terms):
                if term.lower() in note_text:
                    score += (len(all_terms) - i)  # Higher weight for original query
            if score > 0:
                scored_notes.append((note, score))
        
        # Sort by score
        scored_notes.sort(key=lambda x: x[1], reverse=True)
        
        results = [{
            "id": n.id,
            "title": n.title,
            "score": s,
            "preview": (n.content or "")[:150]
        } for n, s in scored_notes[:20]]
        
        crud.create_activity(db, user_id=current_user.id, activity_type="ai_semantic_search",
                           description=f"Semantic search: {query}")
        return {"query": query, "expanded_terms": expanded_terms, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ANALYTICS ROUTES ====================

@app.get("/api/analytics", response_model=schemas.AnalyticsOut)
async def get_analytics_dashboard(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics dashboard data"""
    analytics_data = crud.get_analytics(db, current_user.id)
    return analytics_data


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to NoteAI Pro API This uses ai",
        "version": "1.0.0",
        "docs": "/api/docs"
    }
