import urllib.request
import json

endpoints = [
    'http://localhost:8000/api/dashboard/stats',
    'http://localhost:8000/api/trains',
    'http://localhost:8000/api/health'
]

for url in endpoints:
    try:
        response = urllib.request.urlopen(url, timeout=3)
        data = json.loads(response.read())
        status = response.status
        print(f'[OK] API Response {status}')
    except Exception as e:
        print(f'[ERROR] {str(e)[:60]}')
