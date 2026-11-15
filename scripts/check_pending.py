import requests

BASE_URL = "http://localhost:8082/api"
res = requests.post(f"{BASE_URL}/auth/login", json={"tz": 123456789, "password": "admin1234"})
token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

res = requests.get(f"{BASE_URL}/assignment-requests/pending", headers=headers)
print("Pending assignments:", res.json())
