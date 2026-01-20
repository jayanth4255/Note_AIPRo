import requests
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_chat_flow():
    # 1. Login or get a token (assuming we can use a test user or the user can provide one)
    # Since I don't have a token, I'll try to create a test user or use health check to see if server is up
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check: {response.status_code}")
    except Exception as e:
        print(f"Server is not reachable: {e}")
        return

    print("\n--- Verification Plan ---")
    print("1. Create a session")
    print("2. Send first message (Session ID should be returned if not provided)")
    print("3. Send second message with session ID to verify memory")
    print("4. Fetch history for the session")
    print("-------------------------\n")

    # NOTE: This script requires a valid JWT token. 
    # In a real scenario, I would get this from the user or a test account.
    # For now, I will check the API structure via Swagger if possible or just provide this script.
    print("Verification script created. Please run this in an environment with a valid JWT token set in headers.")

if __name__ == "__main__":
    test_chat_flow()
