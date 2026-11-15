"""Logging callbacks — print each agent step and tool call with reasoning."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import mcp_client
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.messages import AIMessage, ToolMessage
logger = logging.getLogger("agent.actions")

_MAX_LOG_CHARS = 1200
# מניעת כפילויות: אותה החלטה לא תישמר פעמיים באותה ריצה
_decision_cache: set[tuple[int, str, str]] = set()


def clear_decision_cache() -> None:
    _decision_cache.clear()


def _persist_decision(incident_id: int, decision: str, reason: str) -> None:
    key = (incident_id, decision, reason)
    if key in _decision_cache:
        return
    _decision_cache.add(key)
    try:
        mcp_client.log_decision(incident_id, decision, reason)
    except Exception as e:
        logger.error("Failed to log decision to server: %s", e)


def _short(value: Any) -> str:
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False, default=str)
    if len(text) > _MAX_LOG_CHARS:
        return text[:_MAX_LOG_CHARS] + "…"
    return text


def configure_action_logging(level: int = logging.INFO) -> None:
    """Ensure agent action lines appear in the console."""
    action_logger = logging.getLogger("agent.actions")
    action_logger.setLevel(level)
    if not action_logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(
            logging.Formatter("%(asctime)s [סוכן] %(message)s", datefmt="%H:%M:%S")
        )
        action_logger.addHandler(handler)
    action_logger.propagate = False


class ExplainableAgentHandler(BaseCallbackHandler):
    """Log model reasoning and every tool invocation."""

    def __init__(self, incident_id: int | None = None):
        super().__init__()
        self.incident_id = incident_id

    # AIMessage נרשם פעם אחת בלבד דרך log_new_messages בזרימת graph (לא כאן)

    def on_tool_start(
        self,
        serialized: dict[str, Any],
        input_str: str,
        **kwargs: Any,
    ) -> None:
        name = serialized.get("name", "unknown_tool")
        logger.info("▶ פעולה: %s", name)
        logger.info("  פרמטרים: %s", input_str)

    def on_tool_end(self, output: Any, **kwargs: Any) -> None:
        logger.info("  תוצאה: %s", _short(output))


def log_ai_message(message: AIMessage, incident_id: int | None = None) -> None:
    content = message.content
    if isinstance(content, list):
        text_parts = [p.get("text", "") for p in content if isinstance(p, dict) and p.get("type") == "text"]
        content = "\n".join(text_parts).strip()
    if content:
        logger.info("💭 הסבר / החלטה:\n%s", content)
        
        # חילוץ ההחלטה והסיבה מתוך הטקסט ושליחה לשרת (אם יש incident_id)
        if incident_id is not None:
            # מזהים את תבנית "[החלטה]" ו"סיבה:" ולוקחים את הטקסט ביניהם ואחריהם
            # שימוש ב-re.finditer עם flag של DOTALL ו-MULTILINE כדי לתמוך בשורות מרובות
            pattern = re.compile(r"\[החלטה\]\s*(.*?)\s*\|\s*סיבה:\s*(.*?)(?=\n\[החלטה\]|\n\Z|$)", re.DOTALL | re.IGNORECASE)
            matches = list(pattern.finditer(content))
            
            # אם לא נמצאה התאמה עם "|", ננסה תבנית פשוטה יותר
            if not matches:
                fallback_pattern = re.compile(r"\[החלטה\]\s*(.*?)\s*סיבה:\s*(.*?)(?=\n\[החלטה\]|\n\Z|$)", re.DOTALL | re.IGNORECASE)
                matches = list(fallback_pattern.finditer(content))
            
            for match in matches:
                _persist_decision(
                    incident_id,
                    match.group(1).strip(),
                    match.group(2).strip(),
                )

    for tool_call in message.tool_calls or []:
        name = tool_call.get("name", "?")
        args = tool_call.get("args", {})
        logger.info("  → מתוכנן כלי: %s(%s)", name, _short(args))


def log_tool_message(message: ToolMessage) -> None:
    logger.info("✓ כלי %s החזיר: %s", message.name, _short(message.content))


def log_new_messages(messages: list[Any], start_index: int, incident_id: int | None = None) -> None:
    for message in messages[start_index:]:
        if isinstance(message, AIMessage):
            log_ai_message(message, incident_id)
        elif isinstance(message, ToolMessage):
            log_tool_message(message)
