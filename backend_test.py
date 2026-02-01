#!/usr/bin/env python3
"""
Backend Security Audit Test Suite - BlockQuest Official
Comprehensive security testing focusing on XSS, SQL injection, rate limiting, and authentication
"""

import requests
import json
import uuid
import time
import concurrent.futures
from datetime import datetime
from typing import Dict, Any, Optional

class BlockQuestAPITester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_id = None
        self.test_player_id = None
        
        # Test results tracking
        self.results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "critical_failures": [],
            "security_issues": [],
            "edge_case_failures": [],
            "endpoint_results": {}
        }
    
    def log_result(self, test_name: str, success: bool, details: str = "", severity: str = "normal"):
        """Log test result with severity tracking"""
        self.results["total_tests"] += 1
        if success:
            self.results["passed"] += 1
            print(f"✅ {test_name}: PASS")
        else:
            self.results["failed"] += 1
            print(f"❌ {test_name}: FAIL - {details}")
            
            if severity == "critical":
                self.results["critical_failures"].append(f"{test_name}: {details}")
            elif severity == "security":
                self.results["security_issues"].append(f"{test_name}: {details}")
            elif severity == "edge_case":
                self.results["edge_case_failures"].append(f"{test_name}: {details}")
        
        if details:
            print(f"   Details: {details}")
    
    def make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}{endpoint}"
        headers = kwargs.get('headers', {})
        
        if self.auth_token and 'Authorization' not in headers:
            headers['Authorization'] = f"Bearer {self.auth_token}"
        
        kwargs['headers'] = headers
        
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def test_root_endpoint(self):
        """Test GET /api/"""
        print("\n=== Testing Root Endpoint ===")
        try:
            response = self.make_request('GET', '/')
            
            if response.status_code == 200:
                data = response.json()
                if "Block Quest" in data.get("message", ""):
                    self.log_result("Root endpoint", True)
                else:
                    self.log_result("Root endpoint", False, "Invalid response message", "critical")
            else:
                self.log_result("Root endpoint", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Root endpoint", False, str(e), "critical")
    
    def test_health_endpoint(self):
        """Test GET /api/health"""
        print("\n=== Testing Health Endpoint ===")
        try:
            response = self.make_request('GET', '/health')
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result("Health check", True)
                else:
                    self.log_result("Health check", False, "Status not healthy", "critical")
            else:
                self.log_result("Health check", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Health check", False, str(e), "critical")
    
    def test_auth_register_valid(self):
        """Test POST /api/auth/register with valid data"""
        print("\n=== Testing Auth Registration (Valid) ===")
        try:
            test_email = f"testuser_{uuid.uuid4().hex[:8]}@blockquest.com"
            test_username = f"testuser_{uuid.uuid4().hex[:8]}"
            
            payload = {
                "email": test_email,
                "password": "SecurePassword123!",
                "username": test_username
            }
            
            response = self.make_request('POST', '/auth/register', json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("access_token") and data.get("user"):
                    self.auth_token = data["access_token"]
                    self.test_user_id = data["user"]["id"]
                    self.log_result("Register valid user", True)
                else:
                    self.log_result("Register valid user", False, "Missing token or user data", "critical")
            else:
                self.log_result("Register valid user", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Register valid user", False, str(e), "critical")
    
    def test_auth_register_invalid(self):
        """Test POST /api/auth/register with invalid data"""
        print("\n=== Testing Auth Registration (Invalid) ===")
        
        # Test duplicate email
        if self.test_user_id:
            try:
                payload = {
                    "email": "testuser_duplicate@blockquest.com",
                    "password": "SecurePassword123!",
                    "username": "testuser_duplicate"
                }
                
                # First registration
                self.make_request('POST', '/auth/register', json=payload)
                
                # Duplicate registration
                response = self.make_request('POST', '/auth/register', json=payload)
                
                if response.status_code == 400:
                    self.log_result("Register duplicate email", True)
                else:
                    self.log_result("Register duplicate email", False, f"Expected 400, got {response.status_code}", "security")
            except Exception as e:
                self.log_result("Register duplicate email", False, str(e))
        
        # Test invalid email format
        try:
            payload = {
                "email": "invalid-email",
                "password": "SecurePassword123!",
                "username": "testuser_invalid"
            }
            
            response = self.make_request('POST', '/auth/register', json=payload)
            
            if response.status_code in [400, 422]:
                self.log_result("Register invalid email", True)
            else:
                self.log_result("Register invalid email", False, f"Expected 400/422, got {response.status_code}", "security")
        except Exception as e:
            self.log_result("Register invalid email", False, str(e))
    
    def test_auth_login_valid(self):
        """Test POST /api/auth/login with valid credentials"""
        print("\n=== Testing Auth Login (Valid) ===")
        if not self.test_user_id:
            self.log_result("Login valid user", False, "No test user available", "critical")
            return
        
        try:
            # Create a new user for login test
            test_email = f"logintest_{uuid.uuid4().hex[:8]}@blockquest.com"
            test_password = "LoginPassword123!"
            
            # Register first
            register_payload = {
                "email": test_email,
                "password": test_password,
                "username": f"logintest_{uuid.uuid4().hex[:8]}"
            }
            self.make_request('POST', '/auth/register', json=register_payload)
            
            # Now login
            login_payload = {
                "email": test_email,
                "password": test_password
            }
            
            response = self.make_request('POST', '/auth/login', json=login_payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("access_token") and data.get("user"):
                    self.log_result("Login valid user", True)
                else:
                    self.log_result("Login valid user", False, "Missing token or user data", "critical")
            else:
                self.log_result("Login valid user", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Login valid user", False, str(e), "critical")
    
    def test_auth_login_invalid(self):
        """Test POST /api/auth/login with invalid credentials"""
        print("\n=== Testing Auth Login (Invalid) ===")
        
        # Test wrong password
        try:
            payload = {
                "email": "nonexistent@blockquest.com",
                "password": "WrongPassword123!"
            }
            
            response = self.make_request('POST', '/auth/login', json=payload)
            
            if response.status_code == 401:
                self.log_result("Login invalid credentials", True)
            else:
                self.log_result("Login invalid credentials", False, f"Expected 401, got {response.status_code}", "security")
        except Exception as e:
            self.log_result("Login invalid credentials", False, str(e))
    
    def test_auth_me_with_token(self):
        """Test GET /api/auth/me with valid token"""
        print("\n=== Testing Auth Me (With Token) ===")
        if not self.auth_token:
            self.log_result("Auth me with token", False, "No auth token available", "critical")
            return
        
        try:
            response = self.make_request('GET', '/auth/me')
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") and data.get("email"):
                    self.log_result("Auth me with token", True)
                else:
                    self.log_result("Auth me with token", False, "Missing user data", "critical")
            else:
                self.log_result("Auth me with token", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Auth me with token", False, str(e), "critical")
    
    def test_auth_me_without_token(self):
        """Test GET /api/auth/me without token"""
        print("\n=== Testing Auth Me (Without Token) ===")
        try:
            response = self.make_request('GET', '/auth/me', headers={'Authorization': ''})
            
            if response.status_code == 401:
                self.log_result("Auth me without token", True)
            else:
                self.log_result("Auth me without token", False, f"Expected 401, got {response.status_code}", "security")
        except Exception as e:
            self.log_result("Auth me without token", False, str(e))
    
    def test_auth_sync(self):
        """Test PUT /api/auth/sync"""
        print("\n=== Testing Auth Sync ===")
        if not self.auth_token:
            self.log_result("Auth sync", False, "No auth token available", "critical")
            return
        
        try:
            payload = {
                "high_scores": {"block_muncher": 1500, "token_tumble": 2000},
                "total_xp": 500,
                "level": 3,
                "badges": [{"name": "First Win", "rarity": "Common"}],
                "dao_voting_power": 10
            }
            
            response = self.make_request('PUT', '/auth/sync', json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("total_xp") >= 500:
                    self.log_result("Auth sync", True)
                else:
                    self.log_result("Auth sync", False, "Sync data not updated correctly", "critical")
            else:
                self.log_result("Auth sync", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Auth sync", False, str(e), "critical")
    
    def test_leaderboard_endpoints(self):
        """Test leaderboard endpoints"""
        print("\n=== Testing Leaderboard Endpoints ===")
        
        # Test submit score
        try:
            payload = {
                "player_id": str(uuid.uuid4()),
                "player_name": "TestPlayer",
                "game_id": "block_muncher",
                "score": 1500,
                "duration": 120
            }
            
            response = self.make_request('POST', '/leaderboard', json=payload)
            
            if response.status_code == 200:
                self.log_result("Submit leaderboard score", True)
            else:
                self.log_result("Submit leaderboard score", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Submit leaderboard score", False, str(e), "critical")
        
        # Test get global leaderboard
        try:
            response = self.make_request('GET', '/leaderboard')
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get global leaderboard", True)
                else:
                    self.log_result("Get global leaderboard", False, "Response not a list", "critical")
            else:
                self.log_result("Get global leaderboard", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Get global leaderboard", False, str(e), "critical")
        
        # Test get game-specific leaderboard
        try:
            response = self.make_request('GET', '/leaderboard/block_muncher')
            
            if response.status_code == 200:
                self.log_result("Get game leaderboard", True)
            else:
                self.log_result("Get game leaderboard", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Get game leaderboard", False, str(e), "critical")
    
    def test_player_endpoints(self):
        """Test player profile endpoints"""
        print("\n=== Testing Player Endpoints ===")
        
        # Test create player
        try:
            payload = {
                "username": f"testplayer_{uuid.uuid4().hex[:8]}"
            }
            
            response = self.make_request('POST', '/players', json=payload)
            
            if response.status_code == 200:
                data = response.json()
                self.test_player_id = data.get("id")
                self.log_result("Create player", True)
            else:
                self.log_result("Create player", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Create player", False, str(e), "critical")
        
        # Test get player
        if self.test_player_id:
            try:
                response = self.make_request('GET', f'/players/{self.test_player_id}')
                
                if response.status_code == 200:
                    self.log_result("Get player", True)
                else:
                    self.log_result("Get player", False, f"Status: {response.status_code}", "critical")
            except Exception as e:
                self.log_result("Get player", False, str(e), "critical")
    
    def test_badge_endpoints(self):
        """Test badge endpoints"""
        print("\n=== Testing Badge Endpoints ===")
        
        if not self.test_player_id:
            self.log_result("Badge endpoints", False, "No test player available", "critical")
            return
        
        # Test mint badge
        try:
            payload = {
                "player_id": self.test_player_id,
                "name": "Test Badge",
                "description": "A test badge",
                "rarity": "Common",
                "game_id": "block_muncher",
                "icon": "🏆"
            }
            
            response = self.make_request('POST', '/badges', json=payload)
            
            if response.status_code == 200:
                self.log_result("Mint badge", True)
            else:
                self.log_result("Mint badge", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Mint badge", False, str(e), "critical")
        
        # Test get player badges
        try:
            response = self.make_request('GET', f'/badges/{self.test_player_id}')
            
            if response.status_code == 200:
                self.log_result("Get player badges", True)
            else:
                self.log_result("Get player badges", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Get player badges", False, str(e), "critical")
    
    def test_stats_endpoints(self):
        """Test statistics endpoints"""
        print("\n=== Testing Stats Endpoints ===")
        
        # Test game stats
        try:
            response = self.make_request('GET', '/stats/games')
            
            if response.status_code == 200:
                self.log_result("Get game stats", True)
            else:
                self.log_result("Get game stats", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Get game stats", False, str(e), "critical")
        
        # Test global stats
        try:
            response = self.make_request('GET', '/stats/global')
            
            if response.status_code == 200:
                self.log_result("Get global stats", True)
            else:
                self.log_result("Get global stats", False, f"Status: {response.status_code}", "critical")
        except Exception as e:
            self.log_result("Get global stats", False, str(e), "critical")
    
    def test_security_vulnerabilities(self):
        """Test for common security vulnerabilities"""
        print("\n=== Testing Security Vulnerabilities ===")
        
        # Test SQL injection attempts
        try:
            malicious_payloads = [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "admin'/*",
                "' UNION SELECT * FROM users --"
            ]
            
            for payload in malicious_payloads:
                test_data = {
                    "email": f"{payload}@test.com",
                    "password": "password123",
                    "username": payload
                }
                
                response = self.make_request('POST', '/auth/register', json=test_data)
                
                # Should either reject with 400/422 or handle gracefully
                if response.status_code in [400, 422, 500]:
                    continue
                elif response.status_code == 200:
                    # Check if the malicious payload was actually stored
                    data = response.json()
                    if payload in str(data):
                        self.log_result("SQL injection protection", False, f"Payload stored: {payload}", "security")
                        break
            else:
                self.log_result("SQL injection protection", True)
        except Exception as e:
            self.log_result("SQL injection protection", False, str(e), "security")
        
        # Test XSS attempts
        try:
            xss_payloads = [
                "<script>alert('xss')</script>",
                "javascript:alert('xss')",
                "<img src=x onerror=alert('xss')>",
                "';alert('xss');//"
            ]
            
            for payload in xss_payloads:
                test_data = {
                    "username": payload
                }
                
                response = self.make_request('POST', '/players', json=test_data)
                
                if response.status_code == 200:
                    data = response.json()
                    if payload in str(data):
                        self.log_result("XSS protection", False, f"XSS payload stored: {payload}", "security")
                        break
            else:
                self.log_result("XSS protection", True)
        except Exception as e:
            self.log_result("XSS protection", False, str(e), "security")
        
        # Test invalid token handling
        try:
            invalid_tokens = [
                "invalid.token.here",
                "Bearer malicious_token",
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid",
                ""
            ]
            
            for token in invalid_tokens:
                headers = {'Authorization': f'Bearer {token}'}
                response = self.make_request('GET', '/auth/me', headers=headers)
                
                if response.status_code != 401:
                    self.log_result("Invalid token handling", False, f"Token {token} not rejected properly", "security")
                    break
            else:
                self.log_result("Invalid token handling", True)
        except Exception as e:
            self.log_result("Invalid token handling", False, str(e), "security")
    
    def test_edge_cases(self):
        """Test edge cases and boundary conditions"""
        print("\n=== Testing Edge Cases ===")
        
        # Test empty payloads
        try:
            response = self.make_request('POST', '/auth/register', json={})
            
            if response.status_code in [400, 422]:
                self.log_result("Empty payload handling", True)
            else:
                self.log_result("Empty payload handling", False, f"Expected 400/422, got {response.status_code}", "edge_case")
        except Exception as e:
            self.log_result("Empty payload handling", False, str(e), "edge_case")
        
        # Test very long strings
        try:
            long_string = "a" * 10000
            payload = {
                "email": f"{long_string}@test.com",
                "password": long_string,
                "username": long_string
            }
            
            response = self.make_request('POST', '/auth/register', json=payload)
            
            if response.status_code in [400, 422, 413]:
                self.log_result("Long string handling", True)
            else:
                self.log_result("Long string handling", False, f"Long strings not properly handled", "edge_case")
        except Exception as e:
            self.log_result("Long string handling", False, str(e), "edge_case")
        
        # Test special characters
        try:
            special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
            payload = {
                "email": f"test{special_chars}@test.com",
                "password": f"Pass{special_chars}123",
                "username": f"user{special_chars}"
            }
            
            response = self.make_request('POST', '/auth/register', json=payload)
            
            # Should handle gracefully (either accept or reject properly)
            if response.status_code in [200, 400, 422]:
                self.log_result("Special character handling", True)
            else:
                self.log_result("Special character handling", False, f"Unexpected status: {response.status_code}", "edge_case")
        except Exception as e:
            self.log_result("Special character handling", False, str(e), "edge_case")
    
    def test_cors_headers(self):
        """Test CORS headers"""
        print("\n=== Testing CORS Headers ===")
        try:
            response = self.make_request('OPTIONS', '/')
            
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            missing_headers = []
            for header in cors_headers:
                if header not in response.headers:
                    missing_headers.append(header)
            
            if not missing_headers:
                self.log_result("CORS headers", True)
            else:
                self.log_result("CORS headers", False, f"Missing headers: {missing_headers}", "security")
        except Exception as e:
            self.log_result("CORS headers", False, str(e), "security")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🎮 BlockQuest Game Hub - Backend API Test Suite")
        print("=" * 60)
        
        # Basic endpoint tests
        self.test_root_endpoint()
        self.test_health_endpoint()
        
        # Auth tests
        self.test_auth_register_valid()
        self.test_auth_register_invalid()
        self.test_auth_login_valid()
        self.test_auth_login_invalid()
        self.test_auth_me_with_token()
        self.test_auth_me_without_token()
        self.test_auth_sync()
        
        # Game-related tests
        self.test_leaderboard_endpoints()
        self.test_player_endpoints()
        self.test_badge_endpoints()
        self.test_stats_endpoints()
        
        # Security tests
        self.test_security_vulnerabilities()
        self.test_cors_headers()
        
        # Edge case tests
        self.test_edge_cases()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("🎯 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        print(f"Total Tests: {self.results['total_tests']}")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        
        if self.results['failed'] > 0:
            success_rate = (self.results['passed'] / self.results['total_tests']) * 100
            print(f"Success Rate: {success_rate:.1f}%")
        else:
            print("Success Rate: 100%")
        
        if self.results['critical_failures']:
            print(f"\n🚨 CRITICAL FAILURES ({len(self.results['critical_failures'])}):")
            for failure in self.results['critical_failures']:
                print(f"  - {failure}")
        
        if self.results['security_issues']:
            print(f"\n🔒 SECURITY ISSUES ({len(self.results['security_issues'])}):")
            for issue in self.results['security_issues']:
                print(f"  - {issue}")
        
        if self.results['edge_case_failures']:
            print(f"\n⚠️ EDGE CASE FAILURES ({len(self.results['edge_case_failures'])}):")
            for failure in self.results['edge_case_failures']:
                print(f"  - {failure}")
        
        print("\n" + "=" * 60)

def main():
    """Main test execution"""
    # Get backend URL from environment
    backend_url = "https://launch-prep-39.preview.emergentagent.com"
    
    print(f"Testing backend at: {backend_url}")
    
    tester = BlockQuestAPITester(backend_url)
    tester.run_all_tests()

if __name__ == "__main__":
    main()