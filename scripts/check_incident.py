import requests

BASE_URL = "http://localhost:8082/api"
res = requests.post(f"{BASE_URL}/auth/login", json={"tz": 123456789, "password": "admin1234"})
token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

res = requests.get(f"{BASE_URL}/incidents", headers=headers)
incidents = res.json()

# Sort by id desc
incidents.sort(key=lambda x: x["id"], reverse=True)

for inc in incidents[:5]:
    print(f"\nIncident {inc['id']} ({inc['status']}):")
    # check agent logs
    res_agent = requests.get(f"{BASE_URL}/agent-logs/by-incident/{inc['id']}", headers=headers)
    agent_logs = res_agent.json()
    print(f"  Agent logs: {len(agent_logs)}")
    
    # check action logs
    res_action = requests.get(f"{BASE_URL}/action-logs/search/by-incident/{inc['id']}", headers=headers)
    action_logs = res_action.json()
    print(f"  Action logs: {len(action_logs)}")
