import os
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent
load_dotenv(_ROOT / ".env")


def _require(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


OPENAI_API_KEY: str = _require("OPENAI_API_KEY")
SPRING_BASE_URL: str = os.getenv("SPRING_BASE_URL", "http://localhost:8082").rstrip("/")
AGENT_SECRET: str = os.getenv("AGENT_SECRET", "change-me-shared-with-spring")
OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
AGENT_HOST: str = os.getenv("AGENT_HOST", "0.0.0.0")
AGENT_PORT: int = int(os.getenv("AGENT_PORT", "8000"))

def _resolve_system_prompt() -> Path:
    for directory in (_ROOT / "promts", _ROOT / "prompts"):
        path = directory / "system.txt"
        if path.is_file():
            return path
    raise FileNotFoundError(
        f"system.txt not found under {_ROOT / 'promts'} or {_ROOT / 'prompts'}"
    )


SYSTEM_PROMPT_PATH = _resolve_system_prompt()
