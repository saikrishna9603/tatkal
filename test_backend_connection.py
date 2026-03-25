import http.client
import json

print("=" * 60)
print("🔍 TESTING BACKEND API CONNECTION")
print("=" * 60)

# Test 1: Root endpoint
print("\n1️⃣ Testing root endpoint...")
conn = http.client.HTTPConnection("localhost", 8001, timeout=5)
try:
    conn.request("GET", "/")
    response = conn.getresponse()
    data = response.read()
    print(f"Status: {response.status}")
    print(f"Headers: {response.headers}")
    print(f"Body: {data.decode()[:200]}")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    conn.close()

# Test 2: /docs endpoint
print("\n2️⃣ Testing /docs endpoint...")
conn = http.client.HTTPConnection("localhost", 8001, timeout=5)
try:
    conn.request("GET", "/docs")
    response = conn.getresponse()
    data = response.read()
    print(f"Status: {response.status}")
    print(f"Has content: {len(data) > 0}")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    conn.close()

# Test 3: Register endpoint
print("\n3️⃣ Testing registration endpoint...")
payload = json.dumps({
    "full_name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "password": "TestPass123!",
    "confirm_password": "TestPass123!"
})

conn = http.client.HTTPConnection("localhost", 8001, timeout=5)
try:
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    conn.request("POST", "/api/auth/register", payload, headers)
    response = conn.getresponse()
    data = response.read()
    print(f"Status: {response.status}")
    print(f"Response: {data.decode()}")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    conn.close()

print("\n" + "=" * 60)
print("✅ CONNECTION TEST COMPLETE")
print("=" * 60)
