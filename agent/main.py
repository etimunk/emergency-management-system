"""CLI entry — manual agent run (option 3 / debugging)."""

from __future__ import annotations

import argparse
import logging
import sys

from agent.action_logger import configure_action_logging
from agent.runner import run_agent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
configure_action_logging()


def main() -> int:
    parser = argparse.ArgumentParser(description="Run emergency agent once for an incident")
    parser.add_argument("--incident-id", type=int, required=True, help="Incident ID in Spring")
    parser.add_argument(
        "--trigger",
        default="INCIDENT_CREATED",
        choices=[
            "INCIDENT_CREATED",
            "CASUALTY_ADDED",
            "NEW_REPORT",
            "RESOURCE_STATUS_CHANGED",
            "RESOURCE_ASSIGNED",
        ],
    )
    args = parser.parse_args()

    try:
        result = run_agent(args.incident_id, args.trigger)
        print(result)
        return 0
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
