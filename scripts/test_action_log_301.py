import requests

BASE_URL = "http://localhost:8082/api"
res = requests.post(f"{BASE_URL}/auth/login", json={"tz": 200000301, "password": "user1234"})
token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

payload = {
    "incident": {"id": 38},
    "sender": {"tz": 200000301},
    "messageContent": "Test from user 301",
    "requiresAction": False
}
res = requests.post(f"{BASE_URL}/action-logs", headers=headers, json=payload)
print(f"Status: {res.status_code}")
print(f"Body: {res.text}")
