import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

print(f"Testing Gemini AI connection with:")
print(f"API Key: {api_key[:10]}..." if api_key else "No API key found!")
print(f"Model: {model_name}")

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    
    print("\nAttempting text generation...")
    response = model.generate_content("Say 'Gemini AI is working!' if you can hear me.")
    print("Success!")
    print("Response:", response.text)
except Exception as e:
    print("\nFAILED!")
    print("Error:", str(e))
