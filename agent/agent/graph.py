"""LangGraph agent — ReAct loop with explainable action logging."""

from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from agent.action_logger import (
    ExplainableAgentHandler,
    clear_decision_cache,
    configure_action_logging,
    log_new_messages,
)
from config import OPENAI_API_KEY, OPENAI_MODEL, SYSTEM_PROMPT_PATH
from tools import ALL_TOOLS

logger = logging.getLogger(__name__)

configure_action_logging()

with open(SYSTEM_PROMPT_PATH, "r", encoding="utf-8") as f:
    system_prompt_content = f.read()

model = ChatOpenAI(
    openai_api_key=OPENAI_API_KEY,
    model=OPENAI_MODEL,
    temperature=0.2,
)

app = create_react_agent(
    model=model,
    tools=ALL_TOOLS,
    prompt=system_prompt_content,
)


def run_graph(incident_id: int, trigger: str, context: dict[str, Any]) -> str:
    """Run one agent cycle; log every decision and tool call to the console."""
    user_text = f"""Trigger: {trigger}
Incident ID: {incident_id}

הקשר האירוע (JSON):
{json.dumps(context, ensure_ascii=False, indent=2)}

נהל את האירוע. לפני כל שימוש בכלי חובה לכתוב בעברית בפורמט:
[החלטה] <מה אתה עושה> | סיבה: <למה עכשיו>
ואז להפעיל את הכלי."""

    clear_decision_cache()
    input_state = {"messages": [HumanMessage(content=user_text)]}
    callbacks = [ExplainableAgentHandler(incident_id)]

    logger.info("========== תחילת ריצת סוכן | אירוע %s | טריגר %s ==========", incident_id, trigger)

    seen = 0
    final_summary = ""

    for state in app.stream(
        input_state,
        stream_mode="values",
        config={"callbacks": callbacks},
    ):
        messages = state.get("messages", [])
        log_new_messages(messages, seen, incident_id)
        seen = len(messages)
        if messages:
            last = messages[-1]
            if hasattr(last, "content") and last.content and not getattr(last, "tool_calls", None):
                content = last.content
                if isinstance(content, str):
                    final_summary = content

    logger.info("========== סיום ריצת סוכן | אירוע %s ==========", incident_id)
    return final_summary or "(אין סיכום טקסטואלי)"
