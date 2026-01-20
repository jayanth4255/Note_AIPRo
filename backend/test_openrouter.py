import asyncio
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

# Load env vars
load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")
base_url = os.getenv("OPENROUTER_BASE_URL")
model = os.getenv("OPENROUTER_MODEL")

print(f"API Key present: {bool(api_key)}")
print(f"Base URL: {base_url}")
print(f"Model: {model}")

async def test_connection():
    client = AsyncOpenAI(
        api_key=api_key,
        base_url=base_url,
    )
    
    try:
        print("Sending request to OpenRouter...")
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": "Hello, are you working?"}
            ],
        )
        print("\nSuccess! Response:")
        print(response.choices[0].message.content)
    except Exception as e:
        print(f"\nError: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
