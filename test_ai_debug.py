
import asyncio
import os
import sys

# Add the current directory to sys.path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), "backend")))

async def test_ai_chat():
    from backend.app.ai_integration import ai_chat
    from backend.app.config import get_settings
    
    settings = get_settings()
    print(f"DEBUG: Using model {settings.OPENROUTER_MODEL}")
    
    test_text = "Hello, can you hear me?"
    try:
        response = await ai_chat(test_text)
        print(f"SUCCESS: {response}")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_ai_chat())
