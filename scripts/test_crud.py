import requests
import time

BASE_URL = "http://localhost:8082/api"

def print_result(action, res):
    if res.status_code in [200, 201]:
        print(f"[SUCCESS] {action} (Status {res.status_code})")
        try:
            return res.json()
        except:
            return None
    else:
        print(f"[FAILED] {action} (Status {res.status_code}): {res.text}")
        return None

tz_test = 999999998
user_data = {
    "tz": tz_test,
    "name": "Test User",
    "password": "password123",
    "role": "PARAMEDIC",
    "orgType": "MADA"
}

print("=== Authenticating ===")
# Register
res = requests.post(f"{BASE_URL}/auth/register", json=user_data)
print_result("Register User", res)

# Login
res = requests.post(f"{BASE_URL}/auth/login", json={"tz": tz_test, "password": "password123"})
auth_data = print_result("Login User", res)
token = auth_data.get("token") if auth_data else None

headers = {}
if token:
    headers["Authorization"] = f"Bearer {token}"
else:
    print("Cannot proceed without token.")
    exit(1)

print("\n=== Testing Users CRUD ===")
# Read
res = requests.get(f"{BASE_URL}/users/{tz_test}", headers=headers)
read_user = print_result("Read User", res)

# Update
user_data["name"] = "Updated Test User"
res = requests.put(f"{BASE_URL}/users/{tz_test}", json=user_data, headers=headers)
updated_user = print_result("Update User", res)


print("\n=== Testing Resources CRUD ===")
resource_data = {
    "name": "Test Ambulance",
    "orgType": "MADA",
    "resourceType": "AMBULANCE",
    "latitude": 32.0,
    "longitude": 34.0,
    "speed": 0,
    "heading": 0,
    "status": "AVAILABLE",
    "ownerUserId": tz_test
}

# Create Resource
res = requests.post(f"{BASE_URL}/resources", json=resource_data, headers=headers)
created_resource = print_result("Create Resource", res)
resource_id = created_resource.get("id") if created_resource else None

if resource_id:
    # Read Resource
    res = requests.get(f"{BASE_URL}/resources", headers=headers)
    print_result("Read All Resources", res)

    # Update Status
    res = requests.patch(f"{BASE_URL}/resources/{resource_id}/status?status=BUSY", headers=headers)
    print_result("Update Resource Status", res)


print("\n=== Testing Incidents CRUD ===")
incident_data = {
    "description": "Test Incident Fire",
    "locationAddress": "Tel Aviv, Main St 1",
    "latitude": 32.0853,
    "longitude": 34.7818,
    "status": "OPEN",
    "createdBy": tz_test
}

# Create Incident
res = requests.post(f"{BASE_URL}/incidents", json=incident_data, headers=headers)
created_incident = print_result("Create Incident", res)
incident_id = created_incident.get("id") if created_incident else None

if incident_id:
    # Update Incident
    res = requests.patch(f"{BASE_URL}/incidents/{incident_id}/status?status=IN_PROGRESS", headers=headers)
    print_result("Update Incident Status", res)

    # Read Incident
    res = requests.get(f"{BASE_URL}/incidents/{incident_id}", headers=headers)
    print_result("Read Incident", res)
    
    # Assign resource to incident
    if resource_id:
        res = requests.post(f"{BASE_URL}/incidents/{incident_id}/resources/{resource_id}", headers=headers)
        print_result("Assign Resource to Incident", res)

print("\n=== Cleanup ===")
if token:
    res = requests.delete(f"{BASE_URL}/users/{tz_test}", headers=headers)
    print_result("Delete User (and cascading if implemented)", res)

print("\nTests Completed.")
