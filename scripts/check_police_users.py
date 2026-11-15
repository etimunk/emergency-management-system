import requests
res = requests.post("http://localhost:8082/api/auth/login", json={"tz": 123456789, "password": "admin1234"})
token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}
res = requests.get("http://localhost:8082/api/users", headers=headers)
users = res.json()
police_users = [u for u in users if u.get("orgType") == "POLICE"]
for pu in police_users:
    print(f"User {pu['tz']} ({pu['name']}) -> Resource ID: {pu.get('assignedResourceId')}")
