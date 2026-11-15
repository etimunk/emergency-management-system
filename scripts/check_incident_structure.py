import requests
res = requests.post("http://localhost:8082/api/auth/login", json={"tz": 123456789, "password": "admin1234"})
token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}
res = requests.get("http://localhost:8082/api/incidents", headers=headers)
print(res.json()[0])
