# backend/app/ai_integration.py
"""
AI Integration using OpenRouter (OpenAI-compatible)
"""
from openai import AsyncOpenAI
from typing import Optional, Dict, Any, List
from config import get_settings

settings = get_settings()

# Initialize AI client
client = None
if settings.OPENAI_API_KEY:
    print(f"DEBUG: Initializing OpenAI client (Key starts with: {settings.OPENAI_API_KEY[:10]}...)")
    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL or "https://api.openai.com/v1",
    )
elif settings.OPENROUTER_API_KEY:
    print(f"DEBUG: Initializing OpenRouter client (Key starts with: {settings.OPENROUTER_API_KEY[:10]}...)")
    client = AsyncOpenAI(
        api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL,
        default_headers={
            "HTTP-Referer": "http://localhost:5173", # Required by some OpenRouter models
            "X-Title": "NoteAI Pro",
        }
    )
else:
    print("DEBUG: NO AI API KEY CONFIGURED!")

def _get_model():
    """Get the appropriate model name based on provider"""
    model = "gpt-4o-mini"
    if settings.OPENAI_API_KEY:
        model = settings.OPENAI_MODEL or "gpt-4o-mini"
    elif settings.OPENROUTER_MODEL:
        model = settings.OPENROUTER_MODEL
    
    print(f"DEBUG: Using model: {model}")
    return model

def _truncate_text(text: str, max_chars: int = 100000) -> str:
    """Truncate text to safe limit to avoid context length errors"""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "... (truncated)"

async def _generate_text(prompt: str, system_prompt: str = "You are a helpful assistant.", history: List[Dict[str, str]] = None) -> str:
    """Helper to generate text using OpenRouter with history support"""
    if not client:
        raise Exception("OpenRouter API key not configured")
        
    messages = [{"role": "system", "content": system_prompt}]
    
    if history:
        messages.extend(history)
    
    messages.append({"role": "user", "content": prompt})
        
    try:
        response = await client.chat.completions.create(
            model=_get_model(),
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        # Check for context length error
        if "maximum context length" in str(e):
            raise Exception("Text is too long for AI processing. Please try with a shorter section.")
        raise Exception(f"AI generation failed: {str(e)}")

async def ai_chat(text: str, history: List[Dict[str, str]] = None, context: Optional[str] = None) -> str:
    """Chat with the AI using conversation history"""
    system_prompt = "You are a helpful AI assistant for NoteAI Pro. You help users with their notes, organization, and information needs."
    if context:
        system_prompt += f"\n\nContext about the current task or file:\n{context}"
        
    return await _generate_text(text, system_prompt, history)

async def ai_summarize(text: str, mode: str = "short", context: Optional[str] = None) -> str:
    """Summarize text with different modes: short, bullets, key_takeaways, eli5"""
    safe_text = _truncate_text(text)
    
    mode_prompts = {
        "short": "Write a concise 1-2 sentence summary.",
        "bullets": "Summarize as 5 clear bullet points.",
        "key_takeaways": "List the 3-5 most important key takeaways.",
        "eli5": "Explain this simply, as if to someone with no background knowledge.",
        "detailed": "Write a comprehensive summary covering all main points."
    }
    
    instruction = mode_prompts.get(mode, mode_prompts["short"])
    prompt = f"{instruction}\n\nText to summarize:\n{safe_text}"
    
    if context:
        prompt = f"Context: {context}\n\n{prompt}"
    
    return await _generate_text(prompt, "You are an expert summarization assistant.")


async def ai_rewrite(text: str, style: str = "improve") -> str:
    """Rewrite/improve text"""
    # Truncate input
    safe_text = _truncate_text(text)
    
    style_prompts = {
        "improve": "Improve the following text while maintaining its original meaning. Make it clearer and more engaging:",
        "professional": "Rewrite the following text in a professional tone:",
        "casual": "Rewrite the following text in a casual, friendly tone:",
        "concise": "Make the following text more concise without losing important information:"
    }
    
    instruction = style_prompts.get(style, style_prompts["improve"])
    prompt = f"{instruction}\n\n{safe_text}"
    
    return await _generate_text(prompt, "You are a skilled writing assistant that helps improve text quality.")

async def ai_generate_note(topic: str, length: str = "medium") -> Dict[str, Any]:
    """Auto-generate a note based on a topic"""
    length_instructions = {
        "short": "about 3-5 paragraphs",
        "medium": "about 7-10 paragraphs",
        "long": "about 12-15 paragraphs"
    }
    
    instruction = length_instructions.get(length, length_instructions["medium"])
    
    prompt = f"""Generate a comprehensive note about: {topic}

Write {instruction}.

Please structure the note with:
1. A clear, descriptive title
2. Well-organized content with headers and bullet points
3. Key takeaways or summary at the end

Format the response as markdown."""
    
    content = await _generate_text(prompt, "You are a knowledgeable assistant that creates well-structured, informative notes.")
    
    # Extract title
    lines = content.split('\n')
    title = lines[0].replace('#', '').strip() if lines else topic
    
    # Generate tags
    tags = await ai_generate_tags(content)
    
    return {
        "title": title,
        "content": content,
        "tags": tags
    }

async def ai_generate_tags(text: str, max_tags: int = 5) -> List[str]:
    """Generate relevant tags"""
    # Truncate input for tagging too
    safe_text = _truncate_text(text, max_chars=20000)
    
    prompt = f"""Analyze the following text and generate {max_tags} relevant, concise tags (single words or short phrases).
Return only the tags as a comma-separated list, nothing else.

Text:
{safe_text[:1000]}"""
    
    tags_text = await _generate_text(prompt, "You are a content analysis assistant that generates relevant tags.")
    return [tag.strip() for tag in tags_text.split(',')][:max_tags]

async def ai_generate_image(prompt: str, size: str = "1024x1024", quality: str = "standard") -> bytes:
    """Image generation placeholder"""
    raise Exception("Image generation requires a separate image model integration.")

async def ai_text_to_speech(text: str, voice: str = "alloy") -> bytes:
    """TTS placeholder"""
    raise Exception("Text-to-speech requires a separate TTS integration.")

async def ai_get_suggestions(current_text: str, cursor_position: int) -> str:
    """Get text completion suggestions"""
    context_start = max(0, cursor_position - 200)
    context = current_text[context_start:cursor_position]
    
    if len(context.strip()) < 10:
        return ""
    
    prompt = f"""Given this text context, suggest a brief, natural continuation (1-2 sentences max):

{context}"""
    
    return await _generate_text(prompt, "You are a writing assistant providing brief, contextual suggestions.")

async def ai_action(text: str, action: str, **kwargs) -> Any:
    """Unified AI action handler"""
    action_map = {
        "summarize": lambda: ai_summarize(text, kwargs.get("mode", "short"), kwargs.get("context")),
        "rewrite": lambda: ai_rewrite(text, kwargs.get("style", "improve")),
        "improve": lambda: ai_rewrite(text, "improve"),
        "professional": lambda: ai_rewrite(text, "professional"),
        "casual": lambda: ai_rewrite(text, "casual"),
        "concise": lambda: ai_rewrite(text, "concise"),
        "generate": lambda: ai_generate_note(text, kwargs.get("length", "medium")),
        "tags": lambda: ai_generate_tags(text, kwargs.get("max_tags", 5)),
        "format": lambda: ai_auto_format(text),
        "category": lambda: ai_detect_category(text),
        "tasks": lambda: ai_extract_tasks(text),
    }
    
    handler = action_map.get(action)
    if not handler:
        raise ValueError(f"Unknown action: {action}")
        
    return await handler()


# ==================== NEW AI FEATURES ====================

async def ai_detect_category(text: str) -> str:
    """Auto-detect the category of a note."""
    safe_text = _truncate_text(text, max_chars=5000)
    prompt = f"""Analyze the following note and assign ONE category from this list:
[work, study, personal, ideas, tasks, finance, health, travel, other]

Return ONLY the category name in lowercase, nothing else.

Note:
{safe_text}"""
    
    result = await _generate_text(prompt, "You are a text classification expert. Respond with only one word.")
    # Clean up result
    category = result.strip().lower().replace('"', '').replace("'", "")
    valid_categories = ["work", "study", "personal", "ideas", "tasks", "finance", "health", "travel", "other"]
    return category if category in valid_categories else "other"


async def ai_auto_format(text: str) -> str:
    """Clean and structure messy text into well-formatted markdown."""
    safe_text = _truncate_text(text)
    prompt = f"""Clean and format the following messy text into well-structured markdown. Apply these rules:
1. Create clear headings using #, ##, ### where appropriate.
2. Convert any lists to properly formatted bullet points or numbered lists.
3. Format any tasks or to-do items as markdown checkboxes: - [ ] task
4. Add proper paragraph breaks for readability.
5. Preserve ALL original information - do not remove or summarize anything.
6. If there are dates, times, or deadlines, make them stand out.

Text to format:
{safe_text}"""
    
    return await _generate_text(prompt, "You are a professional document formatter. Return clean, readable markdown.")


async def ai_extract_tasks(text: str) -> List[Dict[str, Any]]:
    """Extract tasks and deadlines from note text."""
    import json
    safe_text = _truncate_text(text, max_chars=10000)
    prompt = f"""Extract ALL tasks, to-do items, action items, and deadlines from the following text.

Return as a valid JSON array with objects containing:
- "task": the task description
- "deadline": the deadline if mentioned (or null if none)
- "priority": "high", "medium", or "low" based on urgency indicators

Example output:
[{{"task": "Submit project report", "deadline": "Friday 5pm", "priority": "high"}}, {{"task": "Buy groceries", "deadline": null, "priority": "low"}}]

If no tasks are found, return an empty array: []

Text:
{safe_text}"""
    
    result = await _generate_text(prompt, "You are a task extraction expert. Return valid JSON only.")
    
    # Parse JSON safely
    try:
        # Clean up common issues
        result = result.strip()
        if result.startswith("```json"):
            result = result[7:]
        if result.startswith("```"):
            result = result[3:]
        if result.endswith("```"):
            result = result[:-3]
        return json.loads(result.strip())
    except:
        return []


async def ai_find_related_notes(current_note: str, other_notes: List[Dict[str, Any]]) -> List[int]:
    """Find the most related notes by semantic similarity."""
    if not other_notes:
        return []
    
    current_summary = _truncate_text(current_note, max_chars=500)
    notes_list = "\n".join([f"{i}: {_truncate_text(n.get('title', '') + ' ' + n.get('content', ''), max_chars=200)}" 
                           for i, n in enumerate(other_notes)])
    
    prompt = f"""Given the current note and a list of other notes, identify the 3 most semantically related notes.

CURRENT NOTE:
{current_summary}

OTHER NOTES (numbered):
{notes_list}

Return ONLY the indices of the 3 most related notes as comma-separated numbers (e.g., "2, 5, 1").
If fewer than 3 are related, return only those that are relevant.
If none are related, return "none"."""
    
    result = await _generate_text(prompt, "You are a semantic similarity expert.")
    
    if "none" in result.lower():
        return []
    
    try:
        indices = [int(x.strip()) for x in result.split(",") if x.strip().isdigit()]
        return [i for i in indices if 0 <= i < len(other_notes)][:3]
    except:
        return []


async def ai_expand_search_query(query: str) -> List[str]:
    """Expand a search query with semantically similar terms for better search."""
    prompt = f"""Given the search query "{query}", generate 5 related keywords or phrases that someone might also be looking for.

Return ONLY a comma-separated list of terms, nothing else.
Example: for "python", you might return "programming, coding, script, automation, development"."""
    
    result = await _generate_text(prompt, "You are a search query expansion expert.")
    return [q.strip() for q in result.split(',') if q.strip()][:5]


async def ai_generate_flashcards(text: str, count: int = 5) -> List[Dict[str, str]]:
    """Generate flashcards from note content for study mode."""
    import json
    safe_text = _truncate_text(text, max_chars=10000)
    prompt = f"""Create {count} flashcards from the following study material.
Each flashcard should test understanding of a key concept.

Return as a valid JSON array with objects containing "question" and "answer".
Example: [{{"question": "What is photosynthesis?", "answer": "The process by which plants convert sunlight into energy."}}]

Material:
{safe_text}"""
    
    result = await _generate_text(prompt, "You are an educational content creator. Return valid JSON only.")
    
    try:
        result = result.strip()
        if result.startswith("```json"):
            result = result[7:]
        if result.startswith("```"):
            result = result[3:]
        if result.endswith("```"):
            result = result[:-3]
        return json.loads(result.strip())
    except:
        return []


async def ai_generate_daily_brief(notes: List[Dict[str, Any]], tasks: List[Dict[str, Any]]) -> str:
    """Generate a personalized daily brief summarizing recent notes and pending tasks."""
    notes_summary = "\n".join([f"- {n.get('title', 'Untitled')}" for n in notes[:10]])
    tasks_summary = "\n".join([f"- {t.get('task', '')} (Due: {t.get('deadline', 'No deadline')})" for t in tasks[:10]])
    
    prompt = f"""Create a friendly, concise daily brief for the user. Include:
1. A warm greeting
2. Summary of their recent activity
3. Key priorities for today
4. Any upcoming deadlines to watch

RECENT NOTES:
{notes_summary if notes_summary else "No recent notes"}

PENDING TASKS:
{tasks_summary if tasks_summary else "No pending tasks"}

Keep it brief and motivating!"""
    
    return await _generate_text(prompt, "You are a helpful personal productivity assistant.")


async def ai_ask_notes(question: str, notes_context: str) -> str:
    """Answer a question based only on the user's notes."""
    system_prompt = """You are an AI assistant that answers questions ONLY based on the user's notes provided below.
If the answer cannot be found in the notes, clearly say "I couldn't find information about this in your notes."
Do not make up information. Cite which note the information comes from when possible."""
    
    prompt = f"""USER'S NOTES:
{notes_context}

USER'S QUESTION:
{question}

Answer based only on the notes above:"""
    
    return await _generate_text(prompt, system_prompt)
