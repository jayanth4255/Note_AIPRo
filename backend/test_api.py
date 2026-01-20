#!/usr/bin/env python3
"""
Comprehensive API Test Suite for NoteAI Pro Backend
Tests all major endpoints with sample data
"""
import requests
import json
from time import sleep
import random
import string

# Configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = f"test_{random.randint(1000, 9999)}@example.com"
TEST_PASSWORD = "testpass123"
TEST_NAME = "Test User"

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def log_test(name, status="INFO"):
    """Log test status"""
    color = GREEN if status == "PASS" else RED if status == "FAIL" else YELLOW
    print(f"{color}[{status}]{RESET} {name}")

def log_info(message):
    """Log info message"""
    print(f"{BLUE}ℹ {RESET}{message}")

def log_separator():
    """Print separator line"""
    print(f"\n{'='*60}\n")

# Global variables for test data
token = None
user_id = None
note_id = None

def test_health_check():
    """Test: Health check endpoint"""
    log_separator()
    log_info("Testing Health Check...")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200 and response.json().get("status") == "healthy":
            log_test("Health Check", "PASS")
            log_info(f"Response: {json.dumps(response.json(), indent=2)}")
            return True
        else:
            log_test("Health Check", "FAIL")
            return False
    except Exception as e:
        log_test(f"Health Check - Error: {e}", "FAIL")
        return False

def test_signup():
    """Test: User signup"""
    global token, user_id
    log_separator()
    log_info("Testing User Signup...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": TEST_NAME,
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            token = data.get("access_token")
            user_id = data.get("user", {}).get("id")
            log_test("User Signup", "PASS")
            log_info(f"Created user: {TEST_EMAIL}")
            log_info(f"User ID: {user_id}")
            log_info(f"Token: {token[:20]}...")
            return True
        else:
            log_test(f"User Signup - Status {response.status_code}", "FAIL")
            log_info(f"Response: {response.text}")
            return False
    except Exception as e:
        log_test(f"User Signup - Error: {e}", "FAIL")
        return False

def test_login():
    """Test: User login"""
    global token, user_id
    log_separator()
    log_info("Testing User Login...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user_id = data.get("user", {}).get("id")
            log_test("User Login", "PASS")
            log_info(f"Login successful for: {TEST_EMAIL}")
            return True
        else:
            log_test(f"User Login - Status {response.status_code}", "FAIL")
            return False
    except Exception as e:
        log_test(f"User Login - Error: {e}", "FAIL")
        return False

def test_get_current_user():
    """Test: Get current user"""
    log_separator()
    log_info("Testing Get Current User...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            log_test("Get Current User", "PASS")
            log_info(f"User data: {json.dumps(data, indent=2)}")
            return True
        else:
            log_test(f"Get Current User - Status {response.status_code}", "FAIL")
            return False
    except Exception as e:
        log_test(f"Get Current User - Error: {e}", "FAIL")
        return False

def test_create_note():
    """Test: Create a note"""
    global note_id
    log_separator()
    log_info("Testing Create Note...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/notes",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Test Note - Machine Learning Basics",
                "content": "Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data. It includes supervised learning, unsupervised learning, and reinforcement learning techniques.",
                "tags": ["AI", "ML", "Technology"],
                "is_favorite": False
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            note_id = data.get("id")
            log_test("Create Note", "PASS")
            log_info(f"Created note ID: {note_id}")
            log_info(f"Note data: {json.dumps(data, indent=2)}")
            
            # Check if auto-tagging worked
            if data.get("tags"):
                log_info(f"Auto-generated tags: {data.get('tags')}")
            
            return True
        else:
            log_test(f"Create Note - Status {response.status_code}", "FAIL")
            log_info(f"Response: {response.text}")
            return False
    except Exception as e:
        log_test(f"Create Note - Error: {e}", "FAIL")
        return False

def test_get_notes():
    """Test: Get all notes"""
    log_separator()
    log_info("Testing Get All Notes...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/notes",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            log_test("Get All Notes", "PASS")
            log_info(f"Found {len(data)} notes")
            return True
        else:
            log_test(f"Get All Notes - Status {response.status_code}", "FAIL")
            return False
    except Exception as e:
        log_test(f"Get All Notes - Error: {e}", "FAIL")
        return False

def test_get_single_note():
    """Test: Get a single note"""
    log_separator()
    log_info(f"Testing Get Single Note (ID: {note_id})...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/notes/{note_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            log_test("Get Single Note", "PASS")
            log_info(f"Note: {json.dumps(data, indent=2)}")
            return True
        else:
            log_test(f"Get Single Note - Status {response.status_code}", "FAIL")
            return False
    except Exception as e:
        log_test(f"Get Single Note - Error: {e}", "FAIL")
        return False

def test_update_note():
    """Test: Update a note"""
    log_separator()
    log_info(f"Testing Update Note (ID: {note_id})...")
    
    try:
        response = requests.put(
            f"{BASE_URL}/api/notes/{note_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Updated: Machine Learning Basics",
                "content": "Machine learning is a subset of artificial intelligence. This note has been updated!",
                "is_favorite": True
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            log_test("Update Note", "PASS")
            log_info(f"Updated note version: {data.get('version')}")
            return True
        else:
            log_test(f"Update Note - Status {response.status_code}", "FAIL")
            return False
    except Exception as e:
        log_test(f"Update Note - Error: {e}", "FAIL")
        return False

def test_search_notes():
    """Test: Search notes"""
    log_separator()
    log_info("Testing Search Notes...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/notes/search",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "query": "machine",
                "is_favorite": True,
                "limit": 10
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            log_test("Search Notes", "PASS")
            log_info(f"Found {len(data)} matching notes")
            return True
        else:
            log_test(f"Search Notes - Status {response.status_code}", "FAIL")
            return False
    except Exception as e:
        log_test(f"Search Notes - Error: {e}", "FAIL")
        return False

def test_note_versions():
    """Test: Get note version history"""
    log_separator()
    log_info(f"Testing Get Note Versions (ID: {note_id})...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/notes/{note_id}/versions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            log_test("Get Note Versions", "PASS")
            log_info(f"Found {len(data)} versions")
            if data:
                log_info(f"Latest version: {json.dumps(data[0], indent=2)}")
            return True
        else:
            log_test(f"Get Note Versions - Status {response.status_code}", "FAIL")
            return False
    except Exception as e:
        log_test(f"Get Note Versions - Error: {e}", "FAIL")
        return False

def test_ai_summarize():
    """Test: AI Summarization"""
    log_separator()
    log_info("Testing AI Summarization...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/summarize",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "text": "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals. The term artificial intelligence had previously been used to describe machines that mimic and display human cognitive skills that are associated with the human mind, such as learning and problem-solving.",
                "action": "summarize"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            log_test("AI Summarization", "PASS")
            log_info(f"Summary: {data.get('result')}")
            return True
        else:
            log_test(f"AI Summarization - Status {response.status_code}", "FAIL")
            log_info(f"Response: {response.text}")
            return False
    except Exception as e:
        log_test(f"AI Summarization - Error: {e}", "FAIL")
        return False

def test_ai_rewrite():
    """Test: AI Rewriting"""
    log_separator()
    log_info("Testing AI Rewrite (Improve)...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/rewrite",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "text": "this is a badly written sentence with no punctuation",
                "action": "improve"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            log_test("AI Rewrite", "PASS")
            log_info(f"Improved text: {data.get('result')}")
            return True
        else:
            log_test(f"AI Rewrite - Status {response.status_code}", "FAIL")
            return False
    except Exception as e:
        log_test(f"AI Rewrite - Error: {e}", "FAIL")
        return False

def test_create_share_link():
    """Test: Create share link"""
    log_separator()
    log_info(f"Testing Create Share Link (Note ID: {note_id})...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/notes/{note_id}/share",
            headers={"Authorization": f"Bearer {token}"},
            json={}
        )
        
        if response.status_code == 201:
            data = response.json()
            log_test("Create Share Link", "PASS")
            log_info(f"Share token: {data.get('token')}")
            log_info(f"Share URL: {BASE_URL}/shared/{data.get('token')}")
            return True
        else:
            log_test(f"Create Share Link - Status {response.status_code}", "FAIL")
            return False
    except Exception as e:
        log_test(f"Create Share Link - Error: {e}", "FAIL")
        return False

def test_analytics():
    """Test: Get analytics"""
    log_separator()
    log_info("Testing Analytics Dashboard...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/analytics",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            log_test("Analytics Dashboard", "PASS")
            log_info(f"Total notes: {data.get('total_notes')}")
            log_info(f"Notes this week: {data.get('notes_this_week')}")
            log_info(f"AI operations: {data.get('ai_operations_count')}")
            log_info(f"Analytics data: {json.dumps(data, indent=2)}")
            return True
        else:
            log_test(f"Analytics Dashboard - Status {response.status_code}", "FAIL")
            return False
    except Exception as e:
        log_test(f"Analytics Dashboard - Error: {e}", "FAIL")
        return False

def run_all_tests():
    """Run all tests"""
    print(f"\n{BLUE}{'='*60}")
    print(f"  NOTEAI PRO - BACKEND API TEST SUITE")
    print(f"{'='*60}{RESET}\n")
    
    log_info(f"Base URL: {BASE_URL}")
    log_info(f"Test Email: {TEST_EMAIL}")
    
    tests = [
        ("Health Check", test_health_check),
        ("User Signup", test_signup),
        ("User Login", test_login),
        ("Get Current User", test_get_current_user),
        ("Create Note", test_create_note),
        ("Get All Notes", test_get_notes),
        ("Get Single Note", test_get_single_note),
        ("Update Note", test_update_note),
        ("Search Notes", test_search_notes),
        ("Note Versions", test_note_versions),
        ("AI Summarization", test_ai_summarize),
        ("AI Rewrite", test_ai_rewrite),
        ("Create Share Link", test_create_share_link),
        ("Analytics", test_analytics),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
            sleep(0.5)  # Small delay between tests
        except Exception as e:
            log_test(f"{name} - Unexpected Error: {e}", "FAIL")
            failed += 1
    
    # Summary
    log_separator()
    print(f"\n{BLUE}{'='*60}")
    print(f"  TEST SUMMARY")
    print(f"{'='*60}{RESET}\n")
    
    print(f"{GREEN}✓ Passed: {passed}{RESET}")
    print(f"{RED}✗ Failed: {failed}{RESET}")
    print(f"Total: {passed + failed}")
    
    success_rate = (passed / (passed + failed) * 100) if (passed + failed) > 0 else 0
    print(f"\nSuccess Rate: {success_rate:.1f}%\n")
    
    if failed == 0:
        print(f"{GREEN}🎉 All tests passed!{RESET}\n")
    else:
        print(f"{YELLOW}⚠ Some tests failed. Check the logs above.{RESET}\n")

if __name__ == "__main__":
    run_all_tests()
