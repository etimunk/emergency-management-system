import requests

BASE_URL = "http://localhost:8082/api"
res = requests.post(f"{BASE_URL}/auth/login", json={"tz": 123456789, "password": "admin1234"})
token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

res = requests.get(f"{BASE_URL}/incidents", headers=headers)
incidents = res.json()

print("Incidents with Resource 29 (כיבוי-FT-01):")
for inc in incidents:
    for res_assign in inc.get("assignedResources", []):
        if res_assign.get("id") == 29:
            print(f"Incident {inc['id']} - Status {inc['status']}")
            
print("Incidents with Resource 21 (משטרה-PC-01):")
for inc in incidents:
    for res_assign in inc.get("assignedResources", []):
        if res_assign.get("id") == 21:
            print(f"Incident {inc['id']} - Status {inc['status']}")
