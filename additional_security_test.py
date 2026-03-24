#!/usr/bin/env python3
"""
Additional Security and Rate Limiting Tests for BlockQuest API
"""

import requests
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

def test_rate_limiting():
    """Test rate limiting on endpoints"""
    print("\n=== Testing Rate Limiting ===")
    
    base_url = "https://arcade-cleanup.preview.emergentagent.com/api"
    
    # Test rapid requests to registration endpoint
    def make_register_request(i):
        payload = {
            "email": f"ratetest{i}@test.com",
            "password": "Password123!",
            "username": f"ratetest{i}"
        }
        try:
            response = requests.post(f"{base_url}/auth/register", json=payload, timeout=10)
            return response.status_code, i
        except Exception as e:
            return 500, i
    
    print("Testing rate limiting with 20 concurrent registration requests...")
    
    # Make 20 concurrent requests
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(make_register_request, i) for i in range(20)]
        results = []
        
        for future in as_completed(futures):
            status_code, request_id = future.result()
            results.append(status_code)
    
    # Check if any requests were rate limited (429 status code)
    rate_limited = sum(1 for status in results if status == 429)
    successful = sum(1 for status in results if status == 200)
    errors = sum(1 for status in results if status not in [200, 429, 400])
    
    print(f"Results: {successful} successful, {rate_limited} rate limited, {errors} errors")
    
    if rate_limited > 0:
        print("✅ Rate limiting is working")
    else:
        print("❌ No rate limiting detected - potential security issue")
    
    return rate_limited > 0

def test_cors_preflight():
    """Test CORS preflight requests"""
    print("\n=== Testing CORS Preflight ===")
    
    base_url = "https://arcade-cleanup.preview.emergentagent.com/api"
    
    # Test OPTIONS request
    headers = {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
    
    try:
        response = requests.options(f"{base_url}/auth/register", headers=headers, timeout=10)
        
        print(f"OPTIONS response status: {response.status_code}")
        print("Response headers:")
        for header, value in response.headers.items():
            if 'access-control' in header.lower():
                print(f"  {header}: {value}")
        
        # Check for required CORS headers
        required_headers = [
            'access-control-allow-origin',
            'access-control-allow-methods',
            'access-control-allow-headers'
        ]
        
        missing_headers = []
        for header in required_headers:
            if header not in [h.lower() for h in response.headers.keys()]:
                missing_headers.append(header)
        
        if not missing_headers:
            print("✅ CORS headers present")
            return True
        else:
            print(f"❌ Missing CORS headers: {missing_headers}")
            return False
            
    except Exception as e:
        print(f"❌ CORS test failed: {e}")
        return False

def test_sql_injection_detailed():
    """Detailed SQL injection testing"""
    print("\n=== Detailed SQL Injection Testing ===")
    
    base_url = "https://arcade-cleanup.preview.emergentagent.com/api"
    
    # More sophisticated SQL injection payloads
    sql_payloads = [
        "' OR 1=1 --",
        "'; DROP TABLE users; --",
        "' UNION SELECT password FROM users --",
        "admin'--",
        "' OR 'a'='a",
        "1' OR '1'='1' /*",
        "x'; INSERT INTO users VALUES ('hacker', 'password'); --"
    ]
    
    vulnerable_endpoints = []
    
    for payload in sql_payloads:
        # Test registration endpoint
        try:
            test_data = {
                "email": f"test{payload}@test.com",
                "password": "password123",
                "username": f"user{payload}"
            }
            
            response = requests.post(f"{base_url}/auth/register", json=test_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # Check if the payload appears in the response
                if payload in str(data):
                    vulnerable_endpoints.append(f"Registration endpoint vulnerable to: {payload}")
            
        except Exception as e:
            continue
        
        # Test login endpoint
        try:
            login_data = {
                "email": f"test{payload}@test.com",
                "password": payload
            }
            
            response = requests.post(f"{base_url}/auth/login", json=login_data, timeout=10)
            
            # If we get unexpected success, it might be vulnerable
            if response.status_code == 200:
                vulnerable_endpoints.append(f"Login endpoint potentially vulnerable to: {payload}")
                
        except Exception as e:
            continue
    
    if vulnerable_endpoints:
        print("❌ SQL injection vulnerabilities found:")
        for vuln in vulnerable_endpoints:
            print(f"  - {vuln}")
        return False
    else:
        print("✅ No SQL injection vulnerabilities detected")
        return True

def test_xss_detailed():
    """Detailed XSS testing"""
    print("\n=== Detailed XSS Testing ===")
    
    base_url = "https://arcade-cleanup.preview.emergentagent.com/api"
    
    xss_payloads = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
        "javascript:alert('xss')",
        "<svg onload=alert('xss')>",
        "';alert('xss');//",
        "<iframe src=javascript:alert('xss')></iframe>",
        "<body onload=alert('xss')>"
    ]
    
    vulnerable_endpoints = []
    
    for payload in xss_payloads:
        # Test player creation
        try:
            test_data = {
                "username": payload
            }
            
            response = requests.post(f"{base_url}/players", json=test_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # Check if the payload appears unescaped in the response
                if payload in str(data):
                    vulnerable_endpoints.append(f"Player creation vulnerable to: {payload}")
            
        except Exception as e:
            continue
        
        # Test leaderboard submission
        try:
            test_data = {
                "player_id": "test-id",
                "player_name": payload,
                "game_id": "test-game",
                "score": 100
            }
            
            response = requests.post(f"{base_url}/leaderboard", json=test_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if payload in str(data):
                    vulnerable_endpoints.append(f"Leaderboard submission vulnerable to: {payload}")
                    
        except Exception as e:
            continue
    
    if vulnerable_endpoints:
        print("❌ XSS vulnerabilities found:")
        for vuln in vulnerable_endpoints:
            print(f"  - {vuln}")
        return False
    else:
        print("✅ No XSS vulnerabilities detected")
        return True

def test_authentication_bypass():
    """Test for authentication bypass vulnerabilities"""
    print("\n=== Testing Authentication Bypass ===")
    
    base_url = "https://arcade-cleanup.preview.emergentagent.com/api"
    
    # Test accessing protected endpoints without authentication
    protected_endpoints = [
        "/auth/me",
        "/auth/sync"
    ]
    
    bypass_attempts = []
    
    for endpoint in protected_endpoints:
        # Test with no authorization header
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            if response.status_code == 200:
                bypass_attempts.append(f"{endpoint} accessible without auth")
        except Exception as e:
            continue
        
        # Test with malformed authorization header
        try:
            headers = {'Authorization': 'Bearer invalid_token_format'}
            response = requests.get(f"{base_url}{endpoint}", headers=headers, timeout=10)
            if response.status_code == 200:
                bypass_attempts.append(f"{endpoint} accessible with invalid token")
        except Exception as e:
            continue
        
        # Test with empty authorization header
        try:
            headers = {'Authorization': ''}
            response = requests.get(f"{base_url}{endpoint}", headers=headers, timeout=10)
            if response.status_code == 200:
                bypass_attempts.append(f"{endpoint} accessible with empty auth")
        except Exception as e:
            continue
    
    if bypass_attempts:
        print("❌ Authentication bypass vulnerabilities:")
        for bypass in bypass_attempts:
            print(f"  - {bypass}")
        return False
    else:
        print("✅ No authentication bypass vulnerabilities detected")
        return True

def main():
    """Run additional security tests"""
    print("🔒 BlockQuest API - Additional Security Tests")
    print("=" * 60)
    
    results = {
        "rate_limiting": test_rate_limiting(),
        "cors_preflight": test_cors_preflight(),
        "sql_injection": test_sql_injection_detailed(),
        "xss_protection": test_xss_detailed(),
        "auth_bypass": test_authentication_bypass()
    }
    
    print("\n" + "=" * 60)
    print("🎯 ADDITIONAL SECURITY TEST RESULTS")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    print(f"Security Tests Passed: {passed}/{total}")
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    if passed < total:
        print(f"\n⚠️ Security Score: {(passed/total)*100:.1f}%")
        print("Some security vulnerabilities were detected. Review and fix before production.")
    else:
        print("\n🎉 All additional security tests passed!")

if __name__ == "__main__":
    main()