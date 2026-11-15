import requests

res = requests.post("http://localhost:8000/agent/run", json={
    "incidentId": 38,
    "trigger": "INCIDENT_CREATED"
})
print("Webhook response:", res.status_code, res.text)
