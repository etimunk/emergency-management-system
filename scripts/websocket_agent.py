"""
WebSocket Agent (Python)
========================
סוכן שמתחבר לשרת Spring Boot דרך STOMP ומקבל/שולח הודעות בזמן אמת.

התקנה:
    pip install stomp.py

הפעלה:
    python websocket_agent.py
"""

import stomp
import json
import time

# ========================== הגדרות ==========================
SERVER_HOST = 'localhost'
SERVER_PORT = 8082          # פורט ה-REST + WebSocket
CONNECT_ENDPOINT = '/ws-connect'   # Endpoint שהגדרנו ב-WebSocketConfig


class AgentListener(stomp.ConnectionListener):
    """
    Listener שמקבל הודעות מהשרת.
    כל הודעה שמגיעה לערוץ /topic/updates תודפס כאן.
    """

    def on_error(self, frame):
        print(f"[Agent] ERROR: {frame}")

    def on_message(self, frame):
        try:
            body = json.loads(frame.body)
            print(f"[Agent] Received message: {body}")

            # כאן אפשר להוסיף לוגיקה אמיתית של הסוכן
            # לדוגמה: אם קיבלנו RESOURCE_MOVED → לעדכן את המיקום ב-DB / לבצע חישוב

            # דוגמה: מחזירים תשובת Mock חזרה לשרת
            if body.get('type') == 'RESOURCE_MOVED':
                response = {
                    'type': 'AGENT_ACK',
                    'payload': {
                        'message': 'התקבלה עדכון מיקום',
                        'original': body
                    }
                }
                # שולחים חזרה לשרת (השרת יפיץ ל-/topic/updates)
                conn.send('/app/message', json.dumps(response))
                print("[Agent] Sent ACK back to server")

        except Exception as e:
            print(f"[Agent] Failed to process message: {e}")


# ========================== חיבור לשרת ==========================
conn = stomp.Connection([(SERVER_HOST, SERVER_PORT)])

# רישום ה-Listener
conn.set_listener('', AgentListener())

# התחברות (STOMP רגיל — בלי SockJS)
conn.connect(wait=True)

print("[Agent] Connected to WebSocket server")

# הרשמה לערוץ העדכונים
conn.subscribe('/topic/updates', 1)
print("[Agent] Subscribed to /topic/updates")

# ========================== לולאה ראשית ==========================
try:
    print("[Agent] Waiting for messages... (Ctrl+C to exit)")
    while True:
        time.sleep(1)

except KeyboardInterrupt:
    print("\n[Agent] Disconnecting...")
    conn.disconnect()
    print("[Agent] Disconnected")