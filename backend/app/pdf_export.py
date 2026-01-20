# backend/app/pdf_export.py
"""
PDF export functionality for notes
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from io import BytesIO
from datetime import datetime
from typing import Optional
import html


def clean_html(text: Optional[str]) -> str:
    """
    Clean HTML tags from text for PDF export
    
    Args:
        text: HTML text
    
    Returns:
        Plain text
    """
    if not text:
        return ""
    
    # Unescape HTML entities
    text = html.unescape(text)
    
    # Remove HTML tags (simple approach)
    import re
    text = re.sub('<[^<]+?>', '', text)
    
    return text


def export_note_to_pdf(
    title: str,
    content: Optional[str],
    tags: list,
    created_at: datetime,
    updated_at: datetime,
    author_name: str
) -> bytes:
    """
    Export a note to PDF format
    
    Args:
        title: Note title
        content: Note content (may contain HTML)
        tags: List of tags
        created_at: Creation timestamp
        updated_at: Last update timestamp
        author_name: Author's name
    
    Returns:
        PDF file as bytes
    """
    # Create PDF buffer
    buffer = BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Container for PDF elements
    elements = []
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Create custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor='#1a1a1a',
        spaceAfter=12,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor='#666666',
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor='#333333',
        spaceAfter=8
    )
    
    content_style = ParagraphStyle(
        'CustomContent',
        parent=styles['Normal'],
        fontSize=11,
        textColor='#1a1a1a',
        leading=16,
        spaceAfter=12,
        alignment=TA_LEFT
    )
    
    # Add title
    title_para = Paragraph(title, title_style)
    elements.append(title_para)
    elements.append(Spacer(1, 0.2 * inch))
    
    # Add metadata
    metadata_text = f"""
    <b>Author:</b> {author_name}<br/>
    <b>Created:</b> {created_at.strftime('%B %d, %Y at %I:%M %p')}<br/>
    <b>Last Updated:</b> {updated_at.strftime('%B %d, %Y at %I:%M %p')}
    """
    metadata_para = Paragraph(metadata_text, subtitle_style)
    elements.append(metadata_para)
    
    # Add tags if present
    if tags:
        tags_text = f"<b>Tags:</b> {', '.join(tags)}"
        tags_para = Paragraph(tags_text, subtitle_style)
        elements.append(tags_para)
    
    elements.append(Spacer(1, 0.3 * inch))
    
    # Add separator line
    from reportlab.platypus import HRFlowable
    elements.append(HRFlowable(width="100%", thickness=1, color='#cccccc'))
    elements.append(Spacer(1, 0.3 * inch))
    
    # Add content
    if content:
        # Clean HTML from content
        clean_content = clean_html(content)
        
        # Split content into paragraphs
        paragraphs = clean_content.split('\n')
        
        for para_text in paragraphs:
            para_text = para_text.strip()
            if para_text:
                # Check if it looks like a heading (starts with #)
                if para_text.startswith('#'):
                    para_text = para_text.lstrip('#').strip()
                    para = Paragraph(para_text, heading_style)
                else:
                    para = Paragraph(para_text, content_style)
                
                elements.append(para)
        
    else:
        no_content_para = Paragraph("<i>No content</i>", content_style)
        elements.append(no_content_para)
    
    # Add footer
    elements.append(Spacer(1, 0.5 * inch))
    elements.append(HRFlowable(width="100%", thickness=1, color='#cccccc'))
    footer_text = f"""
    <i>Exported from NoteAI Pro on {datetime.utcnow().strftime('%B %d, %Y')}</i>
    """
    footer_para = Paragraph(footer_text, subtitle_style)
    elements.append(footer_para)
    
    # Build PDF
    doc.build(elements)
    
    # Get PDF bytes
    buffer.seek(0)
    pdf_bytes = buffer.read()
    buffer.close()
    
    return pdf_bytes


def export_multiple_notes_to_pdf(notes_data: list, author_name: str) -> bytes:
    """
    Export multiple notes to a single PDF
    
    Args:
        notes_data: List of note dictionaries
        author_name: Author's name
    
    Returns:
        PDF file as bytes
    """
    # Create PDF buffer
    buffer = BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Title page
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=28,
        alignment=TA_CENTER,
        spaceAfter=30
    )
    
    elements.append(Paragraph(f"{author_name}'s Notes", title_style))
    elements.append(Spacer(1, 0.5 * inch))
    elements.append(Paragraph(
        f"Exported on {datetime.utcnow().strftime('%B %d, %Y')}",
        ParagraphStyle('Subtitle', parent=styles['Normal'], alignment=TA_CENTER)
    ))
    elements.append(PageBreak())
    
    # Add each note
    for i, note in enumerate(notes_data):
        # Export individual note content
        note_pdf = export_note_to_pdf(
            title=note['title'],
            content=note.get('content'),
            tags=note.get('tags', []),
            created_at=note['created_at'],
            updated_at=note['updated_at'],
            author_name=author_name
        )
        
        # Add page break between notes (except for last one)
        if i < len(notes_data) - 1:
            elements.append(PageBreak())
    
    # Build PDF
    doc.build(elements)
    
    buffer.seek(0)
    pdf_bytes = buffer.read()
    buffer.close()
    
    return pdf_bytes
