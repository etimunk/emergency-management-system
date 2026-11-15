import requests

BASE_URL = "http://localhost:8082/api"
res = requests.post(f"{BASE_URL}/auth/login", json={"tz": 123456789, "password": "admin1234"})
token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

res = requests.get(f"{BASE_URL}/users", headers=headers)
users = res.json()
fire_users = [u for u in users if u.get("orgType") == "FIRE_DEPT"]
print("FIRE_DEPT users:")
for fu in fire_users:
    print(f"User {fu['tz']} ({fu['name']}) -> Resource ID: {fu.get('assignedResourceId')}")
