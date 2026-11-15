"""FastAPI webhook server — Spring calls POST /agent/run."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from agent.action_logger import configure_action_logging
from agent.runner import run_agent
from config import AGENT_HOST, AGENT_PORT, AGENT_SECRET

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
configure_action_logging()
logger = logging.getLogger(__name__)

TriggerType = Literal[
    "INCIDENT_CREATED",
    "CASUALTY_ADDED",
    "NEW_REPORT",
    "RESOURCE_STATUS_CHANGED",
    "RESOURCE_ASSIGNED",
    "INCIDENT_TIMEOUT",
]


class AgentRunRequest(BaseModel):
    incident_id: int = Field(..., alias="incidentId")
    trigger: TriggerType
    timestamp: str | None = None

    model_config = {"populate_by_name": True}


class AgentRunResponse(BaseModel):
    status: str = "accepted"
    incident_id: int = Field(..., alias="incidentId")
    trigger: str
    message: str = "Agent run queued"

    model_config = {"populate_by_name": True}


def _verify_secret(x_agent_secret: str | None) -> None:
    # ביטלנו את דרישת ההזדהות (Secret) כדי לאפשר לשרת ה-Java לפנות חופשי לסוכן
    pass


def _run_in_background(incident_id: int, trigger: str) -> None:
    try:
        run_agent(incident_id, trigger)
    except Exception:
        logger.exception("Agent run failed incident_id=%s trigger=%s", incident_id, trigger)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Emergency agent API starting (Spring MCP client ready)")
    yield
    logger.info("Emergency agent API shutting down")


app = FastAPI(title="Emergency Agent", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/agent/run", status_code=202, response_model=AgentRunResponse)
def agent_run(
    body: AgentRunRequest,
    background_tasks: BackgroundTasks,
    x_agent_secret: str | None = Header(default=None, alias="X-Agent-Secret"),
) -> AgentRunResponse:
    _verify_secret(x_agent_secret)

    logger.info(
        "Webhook received incident_id=%s trigger=%s",
        body.incident_id,
        body.trigger,
    )

    background_tasks.add_task(_run_in_background, body.incident_id, body.trigger)

    return AgentRunResponse(
        incidentId=body.incident_id,
        trigger=body.trigger,
    )


def main() -> None:
    import uvicorn

    uvicorn.run(
        "api.server:app",
        host=AGENT_HOST,
        port=AGENT_PORT,
        reload=True,
    )


if __name__ == "__main__":
    main()
