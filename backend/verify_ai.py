import os
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL")
model = os.getenv("OPENAI_MODEL")

print(f"API Key: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")
print(f"Base URL: {base_url}")
print(f"Model: {model}")

async def test_ai():
    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": "Say hello!"}
            ]
        )
        print("Success!")
        print("Response:", response.choices[0].message.content)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test_ai())
