#!/usr/bin/env python3
"""
Backend API Testing for BlockQuest Official - Authentication & Sync Flow
Testing user registration, login, sync, and profile retrieval endpoints
"""

import requests
import json
import sys
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://web3chaos.preview.emergentagent.com/api"

# Test data as specified in the review request
TEST_USER = {
    "username": "SyncTester",
    "email": "synctest1234@test.com", 
    "password": "Test1234!"
}

SYNC_DATA = {
    "high_scores": {"snake": 500},
    "total_xp": 150,
    "level": 2,
    "badges": [],
    "quest_coins": 50,
    "knowledge_tokens": 10,
    "completed_story_episodes": ["ep1-digital-identity"]
}

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"🧪 TESTING: {test_name}")
    print(f"{'='*60}")

def print_result(success, message, details=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if details:
        print(f"Details: {details}")

def test_user_registration():
    """Test POST /api/auth/register"""
    print_test_header("User Registration API")
    
    try:
        url = f"{BACKEND_URL}/auth/register"
        response = requests.post(url, json=TEST_USER, timeout=10)
        
        print(f"Request URL: {url}")
        print(f"Request Body: {json.dumps(TEST_USER, indent=2)}")
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Body: {json.dumps(data, indent=2)}")
            
            # Validate response structure
            required_fields = ["access_token", "token_type", "user"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print_result(False, f"Missing required fields: {missing_fields}")
                return None, None
            
            if data["token_type"] != "bearer":
                print_result(False, f"Expected token_type 'bearer', got '{data['token_type']}'")
                return None, None
                
            user_data = data["user"]
            if user_data["email"] != TEST_USER["email"].lower():
                print_result(False, f"Email mismatch: expected {TEST_USER['email'].lower()}, got {user_data['email']}")
                return None, None
                
            if user_data["username"] != TEST_USER["username"]:
                print_result(False, f"Username mismatch: expected {TEST_USER['username']}, got {user_data['username']}")
                return None, None
            
            print_result(True, "User registration successful")
            return data["access_token"], user_data["id"]
            
        elif response.status_code == 400:
            error_data = response.json()
            if "already" in error_data.get("detail", "").lower():
                print_result(True, "User already exists (expected for repeat tests)")
                # Try to login instead
                return test_user_login()
            else:
                print_result(False, f"Registration failed: {error_data.get('detail', 'Unknown error')}")
                return None, None
        else:
            print_result(False, f"Unexpected status code: {response.status_code}")
            print(f"Response: {response.text}")
            return None, None
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Network error during registration: {str(e)}")
        return None, None
    except Exception as e:
        print_result(False, f"Unexpected error during registration: {str(e)}")
        return None, None

def test_user_login():
    """Test POST /api/auth/login"""
    print_test_header("User Login API")
    
    try:
        url = f"{BACKEND_URL}/auth/login"
        login_data = {
            "email": TEST_USER["email"],
            "password": TEST_USER["password"]
        }
        
        response = requests.post(url, json=login_data, timeout=10)
        
        print(f"Request URL: {url}")
        print(f"Request Body: {json.dumps(login_data, indent=2)}")
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Body: {json.dumps(data, indent=2)}")
            
            # Validate response structure
            required_fields = ["access_token", "token_type", "user"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print_result(False, f"Missing required fields: {missing_fields}")
                return None, None
            
            print_result(True, "User login successful")
            return data["access_token"], data["user"]["id"]
            
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
            print_result(False, f"Login failed: {error_data.get('detail', 'Unknown error')}")
            print(f"Response: {response.text}")
            return None, None
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Network error during login: {str(e)}")
        return None, None
    except Exception as e:
        print_result(False, f"Unexpected error during login: {str(e)}")
        return None, None

def test_sync_endpoint(token):
    """Test PUT /api/auth/sync"""
    print_test_header("Profile Sync API")
    
    try:
        url = f"{BACKEND_URL}/auth/sync"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.put(url, json=SYNC_DATA, headers=headers, timeout=10)
        
        print(f"Request URL: {url}")
        print(f"Request Headers: {json.dumps(headers, indent=2)}")
        print(f"Request Body: {json.dumps(SYNC_DATA, indent=2)}")
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Body: {json.dumps(data, indent=2)}")
            
            # Validate that sync data was applied
            if data.get("total_xp") != SYNC_DATA["total_xp"]:
                print_result(False, f"XP sync failed: expected {SYNC_DATA['total_xp']}, got {data.get('total_xp')}")
                return False
                
            if data.get("level") != SYNC_DATA["level"]:
                print_result(False, f"Level sync failed: expected {SYNC_DATA['level']}, got {data.get('level')}")
                return False
            
            # Check high_scores (note: API might not return this field in UserResponse)
            print_result(True, "Profile sync successful")
            return True
            
        elif response.status_code == 401:
            print_result(False, "Authentication failed - invalid or expired token")
            return False
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
            print_result(False, f"Sync failed: {error_data.get('detail', 'Unknown error')}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Network error during sync: {str(e)}")
        return False
    except Exception as e:
        print_result(False, f"Unexpected error during sync: {str(e)}")
        return False

def test_get_profile(token):
    """Test GET /api/auth/me"""
    print_test_header("Get User Profile API")
    
    try:
        url = f"{BACKEND_URL}/auth/me"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        print(f"Request URL: {url}")
        print(f"Request Headers: {json.dumps(headers, indent=2)}")
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Body: {json.dumps(data, indent=2)}")
            
            # Validate that synced data is present
            if data.get("total_xp") != SYNC_DATA["total_xp"]:
                print_result(False, f"Synced XP not found: expected {SYNC_DATA['total_xp']}, got {data.get('total_xp')}")
                return False
                
            if data.get("level") != SYNC_DATA["level"]:
                print_result(False, f"Synced level not found: expected {SYNC_DATA['level']}, got {data.get('level')}")
                return False
            
            print_result(True, "Profile retrieval successful - sync data verified")
            return True
            
        elif response.status_code == 401:
            print_result(False, "Authentication failed - invalid or expired token")
            return False
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
            print_result(False, f"Profile retrieval failed: {error_data.get('detail', 'Unknown error')}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Network error during profile retrieval: {str(e)}")
        return False
    except Exception as e:
        print_result(False, f"Unexpected error during profile retrieval: {str(e)}")
        return False

def main():
    """Run the complete authentication and sync flow test"""
    print(f"🚀 Starting BlockQuest Authentication & Sync Flow Test")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test User: {TEST_USER['username']} ({TEST_USER['email']})")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Test 1: User Registration
    token, user_id = test_user_registration()
    if not token:
        print("\n❌ CRITICAL: Registration/Login failed - cannot continue with sync tests")
        return False
    
    # Test 2: User Login (if registration was skipped due to existing user)
    if not user_id:
        token, user_id = test_user_login()
        if not token:
            print("\n❌ CRITICAL: Login failed - cannot continue with sync tests")
            return False
    
    # Test 3: Profile Sync
    sync_success = test_sync_endpoint(token)
    if not sync_success:
        print("\n❌ CRITICAL: Profile sync failed")
        return False
    
    # Test 4: Verify Sync by Getting Profile
    profile_success = test_get_profile(token)
    if not profile_success:
        print("\n❌ CRITICAL: Profile retrieval failed or sync data not persisted")
        return False
    
    print(f"\n{'='*60}")
    print("🎉 ALL TESTS PASSED - Authentication & Sync Flow Working!")
    print(f"{'='*60}")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)