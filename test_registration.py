#!/usr/bin/env python
"""Test registration endpoint"""

import requests
import json

print("Testing Registration Endpoint...")
print("="*60)

url = "http://localhost:8001/api/auth/register"
payload = {
    "full_name": "Test User",
    "email": "test123@example.com",
    "phone": "9876543210",
    "password": "TestPass123!",
    "confirm_password": "TestPass123!"
}

print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")
print("\nSending request...")

try:
    response = requests.post(url, json=payload, timeout=10)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response Headers: {response.headers}")
    print(f"\nResponse Body:")
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.ConnectionError as e:
    print(f"❌ Connection Error: {e}")
except requests.exceptions.Timeout as e:
    print(f"❌ Timeout Error: {e}")
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {e}")
