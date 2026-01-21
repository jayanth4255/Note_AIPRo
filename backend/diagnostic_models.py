import asyncio
import os
import sys
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")
base_url = "https://openrouter.ai/api/v1"

models_to_test = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-r1:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "mistralai/mistral-7b-instruct-v0.1:free",
]

async def test_model(model):
    client = AsyncOpenAI(
        api_key=api_key,
        base_url=base_url,
        default_headers={
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "NoteAI Pro",
        }
    )
    
    print(f"\nTesting model: {model}...")
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "hi"}],
            max_tokens=5
        )
        print(f"✅ Success: {response.choices[0].message.content.strip()}")
        return True
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

async def main():
    if not api_key:
        print("API Key not found in .env")
        return

    for model in models_to_test:
        if await test_model(model):
            print(f"\nFound working model: {model}")
            # Update .env here if needed or just report
            break

if __name__ == "__main__":
    asyncio.run(main())
