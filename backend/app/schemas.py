# backend/app/schemas.py
"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


# ==================== USER SCHEMAS ====================

class UserCreate(BaseModel):
    """Schema for user registration"""
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserOut(BaseModel):
    """Schema for user output (no sensitive data)"""
    id: int
    name: str
    email: EmailStr
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class PasswordReset(BaseModel):
    """Schema for password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation"""
    token: str
    new_password: str = Field(..., min_length=6)


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ==================== NOTE SCHEMAS ====================

class NoteCreate(BaseModel):
    """Schema for creating a note"""
    title: str = Field(..., min_length=1, max_length=500)
    content: Optional[str] = None
    tags: List[str] = []
    meta_data: Dict[str, Any] = {}
    is_favorite: bool = False


class NoteUpdate(BaseModel):
    """Schema for updating a note"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    meta_data: Optional[Dict[str, Any]] = None
    is_favorite: Optional[bool] = None
    is_archived: Optional[bool] = None
    is_hidden: Optional[bool] = None


class FileAttachmentOut(BaseModel):
    """Schema for file attachment output (without binary data)"""
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    meta_data: Dict[str, Any] = {}
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class NoteOut(BaseModel):
    """Schema for note output"""
    id: int
    title: str
    content: Optional[str] = None
    tags: List[str] = []
    meta_data: Dict[str, Any] = {}
    is_favorite: bool = False
    is_archived: bool = False
    is_hidden: bool = False
    is_locked: bool = False
    version: int = 1
    user_id: int
    created_at: datetime
    updated_at: datetime
    files: List[FileAttachmentOut] = []
    
    model_config = ConfigDict(from_attributes=True)


class NoteVersionOut(BaseModel):
    """Schema for note version output"""
    id: int
    version_number: int
    title: str
    content: Optional[str] = None
    tags: List[str] = []
    meta_data: Dict[str, Any] = {}
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==================== SHARING SCHEMAS ====================

class SharedLinkCreate(BaseModel):
    """Schema for creating a shared link"""
    expires_at: Optional[datetime] = None
    password: Optional[str] = None


class SharedLinkOut(BaseModel):
    """Schema for shared link output"""
    id: int
    token: str
    is_active: bool
    expires_at: Optional[datetime] = None
    view_count: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SharedNoteAccess(BaseModel):
    """Schema for accessing a shared note"""
    password: Optional[str] = None


# ==================== AI SCHEMAS ====================

class AIRequest(BaseModel):
    """Schema for AI operation requests"""
    text: str
    action: str = Field(..., pattern="^(summarize|rewrite|generate|improve|chat)$")
    context: Optional[str] = None
    chat_id: Optional[str] = None


class AIImageRequest(BaseModel):
    """Schema for AI image generation"""
    prompt: str
    size: str = Field(default="1024x1024", pattern="^(256x256|512x512|1024x1024|1792x1024|1024x1792)$")
    quality: str = Field(default="standard", pattern="^(standard|hd)$")


class AITTSRequest(BaseModel):
    """Schema for text-to-speech"""
    text: str
    voice: str = Field(default="alloy", pattern="^(alloy|echo|fable|onyx|nova|shimmer)$")


class AISuggestionRequest(BaseModel):
    """Schema for real-time AI suggestions"""
    current_text: str
    cursor_position: int


class AIResponse(BaseModel):
    """Schema for AI operation response"""
    result: str
    meta_data: Dict[str, Any] = {}
    chat_id: Optional[str] = None


class ChatMessageCreate(BaseModel):
    """Schema for creating a chat message"""
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatMessageOut(BaseModel):
    """Schema for chat message output"""
    id: int
    chat_id: str
    role: str
    content: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ChatSessionOut(BaseModel):
    """Schema for chat session output"""
    id: str
    user_id: int
    created_at: datetime
    messages: List[ChatMessageOut] = []
    
    model_config = ConfigDict(from_attributes=True)


# ==================== SEARCH & FILTER SCHEMAS ====================

class NoteSearch(BaseModel):
    """Schema for note search"""
    query: Optional[str] = None
    tags: Optional[List[str]] = None
    is_favorite: Optional[bool] = None
    is_archived: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: int = Field(default=50, le=100)
    offset: int = Field(default=0, ge=0)


# ==================== ANALYTICS SCHEMAS ====================

class ActivityCreate(BaseModel):
    """Schema for creating activity log"""
    activity_type: str
    description: Optional[str] = None
    meta_data: Dict[str, Any] = {}
    note_id: Optional[int] = None


class AnalyticsOut(BaseModel):
    """Schema for analytics dashboard data"""
    total_notes: int
    notes_this_week: int
    total_files: int
    total_shared: int
    ai_operations_count: int
    recent_activities: List[Dict[str, Any]] = []
    notes_by_tag: Dict[str, int] = {}
    activity_timeline: List[Dict[str, Any]] = []


# ==================== PRIVACY SCHEMAS ====================

class NoteLockRequest(BaseModel):
    """Schema for locking a note with PIN"""
    pin: str = Field(..., min_length=4, max_length=6, pattern="^[0-9]+$")


class NoteUnlockRequest(BaseModel):
    """Schema for unlocking a note"""
    pin: str = Field(..., min_length=4, max_length=6, pattern="^[0-9]+$")


class PrivacyResponse(BaseModel):
    """Schema for privacy operation response"""
    success: bool
    message: str


# ==================== FILE UPLOAD SCHEMAS ====================

class FileUploadResponse(BaseModel):
    """Schema for file upload response"""
    file_id: int
    filename: str
    file_type: str
    file_size: int
    message: str = "File uploaded successfully"
