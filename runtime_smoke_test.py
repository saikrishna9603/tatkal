import json
import uuid
from datetime import datetime
from urllib import request, parse, error

BASE = "http://127.0.0.1:8014"
FRONT = "http://localhost:3004"

results = []


def log(name, ok, detail=""):
    results.append((name, ok, detail))
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name} {('- ' + detail) if detail else ''}")


def http_json(method, url, payload=None):
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = request.Request(url, data=data, headers=headers, method=method)
    try:
        with request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, body, json.loads(body) if body else {}
    except error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body) if body else {}
        except Exception:
            parsed = {"raw": body}
        return e.code, body, parsed


def http_status(url):
    req = request.Request(url, method="GET")
    with request.urlopen(req, timeout=20) as resp:
        return resp.status


# 1) Backend health
status, _, data = http_json("GET", f"{BASE}/health")
log("Backend /health", status == 200 and data.get("status") == "healthy", f"status={status}")

status, _, data = http_json("GET", f"{BASE}/api/system/stats")
log("Backend /api/system/stats", status == 200 and data.get("total_trains", 0) > 0, f"status={status}, trains={data.get('total_trains')}")

# 2) Train detail + search + availability + seat map
status, _, train = http_json("GET", f"{BASE}/api/trains/train_0001")
log("Train detail", status == 200 and train.get("_id") == "train_0001", f"status={status}")

from_station = train.get("from", "Delhi")
to_station = train.get("to", "Mumbai")
departure_date = datetime.now().strftime("%Y-%m-%d")

q = parse.urlencode({
    "from_station": from_station,
    "to_station": to_station,
    "departure_date": departure_date,
    "seat_class": "AC2",
    "page": 1,
    "limit": 5,
    "sort_by": "price",
})
status, _, search_data = http_json("GET", f"{BASE}/api/trains/search?{q}")
log("Train search", status == 200 and isinstance(search_data.get("trains"), list), f"status={status}, results={search_data.get('showing_results')}")

availability_payload = {
    "train_id": "train_0001",
    "departure_date": departure_date,
    "seat_class": "AC2",
    "number_of_passengers": 1,
    "quota": "GENERAL",
}
status, _, avail_data = http_json("POST", f"{BASE}/api/trains/availability", availability_payload)
log("Train availability", status == 200 and "available_count" in avail_data, f"status={status}")

seat_q = parse.urlencode({"seat_class": "AC2"})
status, _, seat_data = http_json("GET", f"{BASE}/api/trains/train_0001/seat-map?{seat_q}")
log("Seat map", status == 200 and "available_seats" in seat_data, f"status={status}")

# 3) Auth register/login/profile
email = f"smoke_{uuid.uuid4().hex[:8]}@example.com"
password = "TestPass123!"
register_payload = {
    "full_name": "Smoke Test User",
    "email": email,
    "phone": "9876543210",
    "password": password,
    "confirm_password": password,
}
status, _, reg_data = http_json("POST", f"{BASE}/api/auth/register", register_payload)
log("Register", status == 200 and reg_data.get("email") == email, f"status={status}")
user_id = reg_data.get("user_id", "")

login_payload = {"email": email, "password": password, "remember_me": False}
status, _, login_data = http_json("POST", f"{BASE}/api/auth/login", login_payload)
log("Login", status == 200 and "access_token" in login_data, f"status={status}")

status, _, profile_data = http_json("GET", f"{BASE}/api/profile/{user_id}")
log("Profile", status == 200 and profile_data.get("user_id") == user_id, f"status={status}")

# 4) Booking normal -> history -> cancel
normal_booking_payload = {
    "user_id": user_id,
    "train_id": "train_0001",
    "train_number": train.get("number", "10001"),
    "from_station": from_station,
    "to_station": to_station,
    "departure_date": departure_date,
    "departure_time": train.get("departureTime", "10:00"),
    "passengers": [
        {
            "name": "Smoke Passenger",
            "age": 29,
            "gender": "M",
            "document_type": "Aadhaar",
            "document_number": "123412341234",
            "phone": "9876543210",
            "email": email,
        }
    ],
    "seat_selections": [
        {
            "passenger_index": 0,
            "seat_number": "A1",
            "seat_class": "AC2",
            "berth_type": "LOWER",
        }
    ],
    "seat_class": "AC2",
    "quota": "GENERAL",
    "payment": {
        "payment_method": "UPI",
        "amount": 1500,
        "currency": "INR",
        "upi_id": "smoke@upi",
    },
    "mobile_number": "9876543210",
    "email": email,
    "special_requirements": "none",
}
status, _, normal_booking = http_json("POST", f"{BASE}/api/bookings/normal", normal_booking_payload)
log("Normal booking", status == 200 and "booking_id" in normal_booking, f"status={status}")
booking_id = normal_booking.get("booking_id", "")
pnr = normal_booking.get("pnr", "")

status, _, history_data = http_json("GET", f"{BASE}/api/bookings/history/{user_id}")
log("Booking history", status == 200 and "bookings" in history_data, f"status={status}, total={history_data.get('total_bookings')}")

cancel_payload = {"booking_id": booking_id, "pnr": pnr, "reason": "smoke test", "user_id": user_id}
status, _, cancel_data = http_json("POST", f"{BASE}/api/bookings/{booking_id}/cancel", cancel_payload)
log("Booking cancel", status == 200 and cancel_data.get("booking_id") == booking_id, f"status={status}")

# 5) Tatkal booking
scheduled_time = datetime.now().strftime("%H:%M")
tatkal_payload = {
    "user_id": user_id,
    "train_id": "train_0001",
    "train_number": train.get("number", "10001"),
    "from_station": from_station,
    "to_station": to_station,
    "departure_date": departure_date,
    "departure_time": train.get("departureTime", "10:00"),
    "passengers": [
        {
            "name": "Tatkal Passenger",
            "age": 31,
            "gender": "M",
            "document_type": "Aadhaar",
            "document_number": "123412341235",
            "phone": "9876543210",
            "email": email,
        }
    ],
    "seat_class": "AC2",
    "payment": {
        "payment_method": "UPI",
        "amount": 1700,
        "currency": "INR",
        "upi_id": "smoke@upi",
    },
    "mobile_number": "9876543210",
    "email": email,
    "scheduled_time": scheduled_time,
    "retry_count": 3,
    "retry_interval": 2,
}
status, _, tatkal_data = http_json("POST", f"{BASE}/api/bookings/tatkal", tatkal_payload)
log("Tatkal booking", status == 200 and tatkal_data.get("success") is True, f"status={status}")

# 6) Agents and system
status, _, agents_health = http_json("GET", f"{BASE}/api/agents/health")
log("Agents health", status == 200 and agents_health.get("orchestrator") == "healthy", f"status={status}")

oq = parse.urlencode({
    "user_id": user_id,
    "train_id": "train_0001",
    "from_station": from_station,
    "to_station": to_station,
    "departure_date": departure_date,
})
status, _, orchestrate_data = http_json("POST", f"{BASE}/api/agents/orchestrate?{oq}")
log("Agents orchestrate", status == 200, f"status={status}")

# 7) Frontend route checks
pages = ["/", "/login", "/register", "/schedule", "/profile", "/booking/tatkal", "/live-agent", "/ml-comparison"]
for path in pages:
    try:
        st = http_status(f"{FRONT}{path}")
        log(f"Frontend {path}", st == 200, f"status={st}")
    except Exception as ex:
        log(f"Frontend {path}", False, str(ex))

failed = [r for r in results if not r[1]]
print("\n========== SUMMARY ==========")
print(f"Total checks: {len(results)}")
print(f"Passed: {len(results) - len(failed)}")
print(f"Failed: {len(failed)}")
if failed:
    print("\nFailed checks:")
    for name, _, detail in failed:
        print(f"- {name}: {detail}")

raise SystemExit(1 if failed else 0)
