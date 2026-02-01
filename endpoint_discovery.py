#!/usr/bin/env python3
"""
Test for additional endpoints that might exist
"""

import requests

def test_endpoint_discovery():
    """Test for additional endpoints"""
    base_url = "https://launch-prep-39.preview.emergentagent.com/api"
    
    # Common endpoint patterns to test
    endpoints_to_test = [
        "/games",
        "/games/list",
        "/game/list",
        "/arcade/games",
        "/status/health",
        "/ping",
        "/version",
        "/info",
        "/docs",
        "/openapi.json",
        "/redoc"
    ]
    
    print("🔍 Testing for additional endpoints...")
    print("=" * 50)
    
    found_endpoints = []
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            
            if response.status_code == 200:
                print(f"✅ Found: {endpoint} (200)")
                found_endpoints.append(endpoint)
            elif response.status_code == 404:
                print(f"❌ Not found: {endpoint} (404)")
            else:
                print(f"⚠️ Unexpected: {endpoint} ({response.status_code})")
                found_endpoints.append(f"{endpoint} ({response.status_code})")
                
        except Exception as e:
            print(f"❌ Error testing {endpoint}: {e}")
    
    print(f"\nFound {len(found_endpoints)} additional endpoints")
    return found_endpoints

if __name__ == "__main__":
    test_endpoint_discovery()