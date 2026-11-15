import requests

BASE_URL = "http://localhost:8082/api"

# Login as admin
res = requests.post(f"{BASE_URL}/auth/login", json={"tz": 123456789, "password": "admin1234"})
if res.status_code != 200:
    print("Login failed")
    exit(1)

token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# Fetch agent logs
res = requests.get(f"{BASE_URL}/agent-logs", headers=headers)
print("Agent logs:")
print(res.json())

# Check MCP ping
res = requests.get(f"{BASE_URL}/mcp/ping")
print("\nMCP Ping:", res.text)
