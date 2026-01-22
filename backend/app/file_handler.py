# backend/app/file_handler.py
"""
File upload and processing utilities
"""
from fastapi import UploadFile, HTTPException
from typing import Optional, Tuple
from PIL import Image
import io
import hashlib
from datetime import datetime
import fitz  # PyMuPDF
from .config import get_settings

settings = get_settings()


def validate_file(file: UploadFile) -> Tuple[bool, Optional[str]]:
# ... (existing validate_file remains same, just ensuring imports)
    """
    Validate uploaded file
    
    Args:
        file: Uploaded file
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check file extension
    if not file.filename:
        return False, "Filename is required"
    
    file_ext = file.filename.split('.')[-1].lower()
    allowed_types = settings.allowed_file_types_list
    
    if file_ext not in allowed_types:
        return False, f"File type .{file_ext} not allowed. Allowed types: {', '.join(allowed_types)}"
    
    # File size validation is handled at FastAPI level
    return True, None


def generate_unique_filename(original_filename: str, user_id: int) -> str:
    """
    Generate a unique filename using timestamp and hash
    
    Args:
        original_filename: Original file name
        user_id: User ID
    
    Returns:
        Unique filename
    """
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    file_ext = original_filename.split('.')[-1].lower()
    
    # Create hash from original filename and user_id
    hash_input = f"{original_filename}{user_id}{timestamp}".encode()
    file_hash = hashlib.md5(hash_input).hexdigest()[:8]
    
    return f"{timestamp}_{file_hash}.{file_ext}"


def get_file_type_category(file_type: str) -> str:
    """
    Categorize file by MIME type
    
    Args:
        file_type: MIME type
    
    Returns:
        Category string (image, video, audio, document, other)
    """
    if file_type.startswith('image/'):
        return 'image'
    elif file_type.startswith('video/'):
        return 'video'
    elif file_type.startswith('audio/'):
        return 'audio'
    elif file_type in ['application/pdf', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'text/plain', 'application/vnd.ms-excel',
                       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']:
        return 'document'
    else:
        return 'other'


def generate_thumbnail(file_data: bytes, file_type: str, max_size: Tuple[int, int] = (200, 200)) -> Optional[bytes]:
    """
    Generate thumbnail for images
    
    Args:
        file_data: Original file data
        file_type: MIME type
        max_size: Maximum thumbnail dimensions
    
    Returns:
        Thumbnail bytes or None if not applicable
    """
    if not file_type.startswith('image/'):
        return None
    
    try:
        image = Image.open(io.BytesIO(file_data))
        
        # Convert RGBA to RGB if necessary
        if image.mode == 'RGBA':
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Create thumbnail
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        thumb_io = io.BytesIO()
        image.save(thumb_io, format='JPEG', quality=85)
        thumb_io.seek(0)
        
        return thumb_io.read()
    
    except Exception as e:
        # If thumbnail generation fails, return None
        return None


def get_image_metadata(file_data: bytes, file_type: str) -> dict:
    """
    Extract metadata from image files
    
    Args:
        file_data: Image file data
        file_type: MIME type
    
    Returns:
        Dictionary with width, height, format, etc.
    """
    if not file_type.startswith('image/'):
        return {}
    
    try:
        image = Image.open(io.BytesIO(file_data))
        
        return {
            "width": image.width,
            "height": image.height,
            "format": image.format,
            "mode": image.mode
        }
    
    except Exception:
        return {}


def extract_text_from_file(file_data: bytes, file_type: str) -> Optional[str]:
    """
    Extract text content from various file types
    
    Args:
        file_data: Original file data
        file_type: MIME type
    
    Returns:
        Extracted text or None
    """
    try:
        if file_type == 'text/plain':
            return file_data.decode('utf-8', errors='ignore')
        
        elif file_type == 'application/pdf':
            doc = fitz.open(stream=file_data, filetype="pdf")
            text = ""
            # Extract from first 10 pages to avoid massive metadata
            for page_num in range(min(doc.page_count, 10)):
                page = doc.load_page(page_num)
                text += page.get_text()
            doc.close()
            return text
            
        return None
    except Exception as e:
        print(f"Text extraction failed: {str(e)}")
        return None


async def process_upload(file: UploadFile, user_id: int) -> Tuple[str, bytes, Optional[bytes], dict]:
    """
    Process an uploaded file
    
    Args:
        file: Uploaded file
        user_id: User ID
    
    Returns:
        Tuple of (unique_filename, file_data, thumbnail_data, metadata)
    
    Raises:
        HTTPException: If file validation fails
    """
    # Validate file
    is_valid, error_msg = validate_file(file)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Read file data
    file_data = await file.read()
    file_size = len(file_data)
    
    # Check file size
    if file_size > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE_MB}MB"
        )
    
    # Generate unique filename
    unique_filename = generate_unique_filename(file.filename, user_id)
    
    # Generate thumbnail for images
    thumbnail_data = generate_thumbnail(file_data, file.content_type)
    
    # Extract metadata
    metadata = {}
    if file.content_type.startswith('image/'):
        metadata = get_image_metadata(file_data, file.content_type)
    
    # Extract text content if applicable
    extracted_text = extract_text_from_file(file_data, file.content_type)
    if extracted_text:
        # Truncate for metadata safety (max 50KB in meta_data JSON)
        metadata["extracted_text"] = extracted_text[:50000]
    
    metadata["category"] = get_file_type_category(file.content_type)
    metadata["original_size"] = file_size
    
    return unique_filename, file_data, thumbnail_data, metadata


def get_file_icon(file_type: str) -> str:
    """
    Get appropriate icon name for file type
    
    Args:
        file_type: MIME type
    
    Returns:
        Icon name/class
    """
    category = get_file_type_category(file_type)
    
    icon_map = {
        'image': 'image',
        'video': 'video',
        'audio': 'music',
        'document': 'file-text',
        'other': 'file'
    }
    
    return icon_map.get(category, 'file')
