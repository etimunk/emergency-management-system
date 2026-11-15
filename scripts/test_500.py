import requests

BASE_URL = "http://localhost:8082/api"

# Login as admin
res = requests.post(f"{BASE_URL}/auth/login", json={"tz": 123456789, "password": "admin1234"})
token = res.json().get("token")
headers = {"Authorization": f"Bearer {token}"}

tz_test = 200000004
user_data = {
    "tz": tz_test,
    "name": "Test User 4",
    "password": "password123",
    "role": "PARAMEDIC",
    "orgType": "MADA"
}

# Delete user and resource if exists
requests.delete(f"{BASE_URL}/users/{tz_test}", headers=headers)

print("POST new user with PARAMEDIC:")
res = requests.post(f"{BASE_URL}/users", json=user_data, headers=headers)
print(res.status_code, res.text)

if res.status_code == 200:
    print("Creating resource...")
    resource_data = {
        "name": "Test Ambulance 101",
        "orgType": "MADA",
        "resourceType": "Ambulance",
        "latitude": 32.0853,
        "longitude": 34.7818,
        "speed": 0,
        "heading": 0,
        "status": "UNAVAILABLE",
        "ownerUserId": tz_test
    }
    res = requests.post(f"{BASE_URL}/resources", json=resource_data, headers=headers)
    print(res.status_code, res.text)
    
    print("\nAttempting to delete the user who is a resource owner...")
    res = requests.delete(f"{BASE_URL}/users/{tz_test}", headers=headers)
    print("Delete user response:", res.status_code)
    
    # Check if resource is now UNAVAILABLE and owner is null
    res = requests.get(f"{BASE_URL}/resources", headers=headers)
    resources = res.json()
    for r in resources:
        if r['name'] == "Test Ambulance 101":
            print("Resource state after user deletion:", r)
