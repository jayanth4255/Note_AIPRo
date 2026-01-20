import asyncio
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL")
model = os.getenv("OPENAI_MODEL")

print(f"Testing AI connection with:")
print(f"API Key: {api_key[:10]}...")
print(f"Base URL: {base_url}")
print(f"Model: {model}")

async def test_ai():
    client = AsyncOpenAI(
        api_key=api_key,
        base_url=base_url
    )
    
    try:
        print("\nAttempting chat completion...")
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": "Hello, say 'AI is working' if you can hear me."}
            ],
            max_tokens=20
        )
        print("Success!")
        print("Response:", response.choices[0].message.content)
    except Exception as e:
        print("\nFAILED!")
        print("Error:", str(e))

if __name__ == "__main__":
    asyncio.run(test_ai())
