#!/usr/bin/env python
"""System Test Script for Tatkal Booking System"""

import requests
import json

BASE_URL = 'http://127.0.0.1:8014'

print('='*60)
print('🧪 TESTING TATKAL BOOKING SYSTEM')
print('='*60)

# Test 1: Health check
print('\n1️⃣  Testing Backend Health...')
try:
    response = requests.get(f'{BASE_URL}/health', timeout=10)
    print(f'   Status: {response.status_code}')
    if response.status_code == 200:
        print('   ✅ Backend is healthy')
    else:
        print(f'   ⚠️  Backend returned: {response.status_code}')
except Exception as e:
    print(f'   ❌ Error: {e}')

# Test 2: Register user
print('\n2️⃣  Testing User Registration...')
try:
    payload = {
        'email': 'test@tatkal.com',
        'password': 'TestPass123!',
        'confirm_password': 'TestPass123!',
        'full_name': 'Test User',
        'phone': '9876543210'
    }
    response = requests.post(
        f'{BASE_URL}/api/auth/register',
        json=payload,
        timeout=10
    )
    print(f'   Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        user_id = data.get('user_id')
        email = data.get('email')
        print(f'   ✅ Registration successful')
        print(f'   User ID: {user_id}')
        print(f'   Email: {email}')
    else:
        print(f'   Status: {response.status_code}')
        text = response.text if response.text else 'No response'
        print(f'   Response: {text}')
except Exception as e:
    print(f'   ❌ Error: {str(e)}')

# Test 3: Check trains
print('\n3️⃣  Testing Train Search...')
try:
    # Use a known train to build a reliable search query
    train_response = requests.get(f'{BASE_URL}/api/trains/train_0001', timeout=10)
    train_response.raise_for_status()
    train_data = train_response.json()

    from_station = train_data.get('from')
    to_station = train_data.get('to')

    response = requests.get(
        f'{BASE_URL}/api/trains/search?from_station={from_station}&to_station={to_station}&departure_date=2026-03-25',
        timeout=10
    )
    print(f'   Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        trains = data.get('trains', [])
        count = len(trains)
        print(f'   ✅ Found {count} trains')
        if trains:
            train = trains[0]
            name = train.get('name')
            print(f'   First train: {name}')
    else:
        text = response.text if response.text else 'No response'
        print(f'   Response: {text}')
except Exception as e:
    print(f'   ❌ Error: {str(e)}')

print('\n' + '='*60)
print('✅ SYSTEM VERIFICATION COMPLETE')
print('='*60)
