import requests

BASE_URL = "http://localhost:8082/api"
res = requests.post(f"{BASE_URL}/auth/login", json={"tz": 123456789, "password": "admin1234"})
token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

payload = {
    "incident": {"id": 38},
    "sender": {"tz": 123456789},
    "messageContent": "Test message",
    "requiresAction": False
}
res = requests.post(f"{BASE_URL}/action-logs", headers=headers, json=payload)
print(f"POST /action-logs Status: {res.status_code}")
print(f"Body: {res.text}")
