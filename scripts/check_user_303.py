import requests

BASE_URL = "http://localhost:8082/api"
res = requests.post(f"{BASE_URL}/auth/login", json={"tz": 123456789, "password": "admin1234"})
token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

tz = 200000303
print(f"Checking user {tz}...")

res = requests.get(f"{BASE_URL}/users/{tz}", headers=headers)
user = res.json()
print("Raw user data:", user)

res = requests.get(f"{BASE_URL}/users/{tz}/operator-profile", headers=headers)
profile = res.json()
print("Operator profile:", profile)
