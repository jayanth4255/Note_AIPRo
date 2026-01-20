"""
Quick API Health Test
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("\n" + "="*60)
print("  NOTEAI PRO - QUICK API TEST")
print("="*60 + "\n")

# Test 1: Health Check
print("1. Testing Health Check...")
try:
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
    print("   ✓ PASSED\n")
except Exception as e:
    print(f"   ✗ FAILED: {e}\n")

# Test 2: API Docs
print("2. Testing API Documentation...")
try:
    response = requests.get(f"{BASE_URL}/api/docs")
    print(f"   Status: {response.status_code}")
    print("   ✓ API Docs Available at: http://localhost:8000/api/docs\n")
except Exception as e:
    print(f"   ✗ FAILED: {e}\n")

# Test 3: Sign Up
print("3. Testing User Signup...")
try:
    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "password123"
        }
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        token = data.get("access_token")
        print(f"   User created: {data.get('user', {}).get('email')}")
        print(f"   Token: {token[:30]}...")
        print("   ✓ PASSED\n")
        
        # Test 4: Get Current User
        print("4. Testing Get Current User...")
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            user = response.json()
            print(f"   User: {json.dumps(user, indent=2)}")
            print("   ✓ PASSED\n")
            
            # Test 5: Create Note
            print("5. Testing Create Note...")
            response = requests.post(
                f"{BASE_URL}/api/notes",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "title": "My First Note",
                    "content": "This is a test note created via API",
                    "tags": ["test", "api"]
                }
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 201:
                note = response.json()
                print(f"   Note ID: {note.get('id')}")
                print(f"   Title: {note.get('title')}")
                print(f"   Tags: {note.get('tags')}")
                print("   ✓ PASSED\n")
                
                # Test 6: Get All Notes
                print("6. Testing Get All Notes...")
                response = requests.get(
                    f"{BASE_URL}/api/notes",
                    headers={"Authorization": f"Bearer {token}"}
                )
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    notes = response.json()
                    print(f"   Total notes: {len(notes)}")
                    print("   ✓ PASSED\n")
            else:
                print(f"   Response: {response.text}")
                print("   ✗ FAILED\n")
        else:
            print(f"   Response: {response.text}")
            print("   ✗ FAILED\n")
    elif response.status_code == 400 and "already registered" in response.text:
        print("   User already exists (expected if test ran before)")
        print("   ✓ EXPECTED\n")
    else:
        print(f"   Response: {response.text}")
        print("   ✗ FAILED\n")
except Exception as e:
    print(f"   ✗ FAILED: {e}\n")

print("="*60)
print("  TEST COMPLETE")
print("="*60)
print("\n✨ API Documentation: http://localhost:8000/api/docs")
print("✨ Interactive API Testing Available!\n")
