"""Run one agent cycle for an incident (called from webhook or CLI)."""

from __future__ import annotations

import logging
from typing import Any

import mcp_client
from agent.action_logger import configure_action_logging
from agent.graph import run_graph

logger = logging.getLogger(__name__)
configure_action_logging()

TRIGGER_HINTS: dict[str, str] = {
    "INCIDENT_CREATED": "נוצר אירוע חדש. הערך חומרה, סטטוס, ומשאבים נדרשים.",
    "CASUALTY_ADDED": "נוסף פצוע. הערך מחדש צורך במשאבים.",
    "NEW_REPORT": "התקבל דיווח מהשטח. הערך מחדש את המצב.",
    "RESOURCE_STATUS_CHANGED": "שינוי בסטטוס משאב. בדוק תקיעות והחלפה במידת הצורך.",
    "RESOURCE_ASSIGNED": "שובץ משאב לאירוע. עקוב אחר התקדמות.",
    "INCIDENT_TIMEOUT": "עברו שעתיים מתחילת האירוע וטרם נסגר. סגור את האירוע עכשיו באמצעות העדכון לסטטוס CLOSED.",
}


def run_agent(incident_id: int, trigger: str) -> dict[str, Any]:
    logger.info("Agent run started incident_id=%s trigger=%s", incident_id, trigger)

    context = mcp_client.get_incident_context(incident_id)
    hint = TRIGGER_HINTS.get(trigger, "בצע הערכת מצב מחדש.")

    summary = run_graph(incident_id, trigger, context)

    logger.info("Agent run finished incident_id=%s summary=%s", incident_id, summary)
    return {
        "incidentId": incident_id,
        "trigger": trigger,
        "hint": hint,
        "summary": summary,
    }
