import requests

BASE_URL = "http://localhost:8082/api"
res = requests.post(f"{BASE_URL}/auth/login", json={"tz": 123456789, "password": "admin1234"})
token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

payload = {
    "description": "Test incident",
    "locationAddress": "Test Location",
    "latitude": 32.0,
    "longitude": 34.0,
    "createdBy": "Admin"
}
res = requests.post(f"{BASE_URL}/incidents", headers=headers, json=payload)
print(f"POST /incidents Status: {res.status_code}")
