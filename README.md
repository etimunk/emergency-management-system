# מערכת ניהול אירועי חירום (Emergency Management System)

מערכת לניהול אירועי חירום ואירועי רב-נפגעים עבור מד"א, משטרה, כבאות וצבא:
מפה חיה של כוחות בשטח, ניהול פצועים לפי טריאז', יומן פעולות, וסוכן AI שמחליט אילו כוחות לשבץ לכל אירוע.

## ארכיטקטורה

| רכיב | תיקייה | פורט | טכנולוגיות |
|---|---|---|---|
| Backend | `src/` | 8082 | Java 21, Spring Boot 3.3, Spring Security + JWT, JPA, WebSocket (STOMP), H2 |
| Frontend | `client/emergency-management-client/` | 5173 | React 19, Vite, Material UI (RTL), React Router, Axios, Leaflet |
| AI Agent | `agent/` | 8000 | Python, FastAPI, LangChain, LangGraph, OpenAI |

```
React  ──REST/JWT + WebSocket──▶  Spring Boot  ──POST /agent/run──▶  Python Agent
                                      ▲                                  │
                                      └──────── /api/mcp/* (tools) ──────┘
```

## הרצה מקומית

### דרישות מוקדמות
- Java 21
- Node.js 20+
- Python 3.12
- מפתח OpenAI API

### 1. שרת (Spring Boot)
```bash
./mvnw spring-boot:run
```
בהפעלה הראשונה נוצר משתמש מנהל: ת"ז `123456789`, סיסמה `admin1234` (לפיתוח בלבד).
קונסולת H2: http://localhost:8082/h2-console

### 2. סוכן AI (Python)
```bash
cd agent
python -m venv .venv
.venv\Scripts\activate        # Windows  (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env        # ואז למלא OPENAI_API_KEY בקובץ .env
python -m api.server
```
טעינת פרוטוקולי ה-PDF למאגר וקטורי (RAG), פעם אחת:
```bash
python -m protocols.ingest_protocol
```

### 3. לקוח (React)
```bash
cd client/emergency-management-client
npm install
npm run dev
```
ואז לפתוח http://localhost:5173

## מבנה הפרויקט
```
src/main/java/.../emergency_project1/
  entities/      ישויות JPA (Incident, Casualty, Resource, User, ActionLog ...)
  controllers/   REST API (/api/incidents, /api/resources, /api/mcp ...)
  services/      לוגיקה עסקית + סימולציית מיקום כוחות
  security/      JWT + Spring Security
  config/        WebSocket, אתחול מנהל, טיפול בשגיאות
agent/
  agent/         גרף LangGraph (ReAct) + תיעוד החלטות
  api/           שרת FastAPI
  tools/         כלים שהסוכן מפעיל מול Spring
  promts/        הנחיית המערכת של הסוכן
  protocols/     טעינת פרוטוקולי חירום (RAG)
client/emergency-management-client/src/
  pages/         מסכי מנהל ומפעיל
  features/      שירותי API ו-hooks לפי תחום
  components/    מפה וכרטיסים
scripts/         סקריפטי בדיקה ועזר ידניים מול השרת
```

## הערות אבטחה
הפרויקט מיועד לפיתוח ולימוד. לפני הפעלה בסביבת ייצור יש להעביר את `jwt.secret`, סיסמת המנהל
ו-`AGENT_SECRET` למשתני סביבה, ולהגן על `/api/mcp/**` ועל `/h2-console`.
