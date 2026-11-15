"""HTTP client for Spring MCP REST API (/api/mcp)."""

from __future__ import annotations

import os
from typing import Any

import httpx

from config import SPRING_BASE_URL

_TIMEOUT = 10.0
_PREFIX = "/api/mcp"


def _url(path: str) -> str:
    return f"{SPRING_BASE_URL}{_PREFIX}{path}"


def _request(method: str, path: str, **kwargs: Any) -> Any:
    with httpx.Client(timeout=_TIMEOUT) as client:
        response = client.request(method, _url(path), **kwargs)
        response.raise_for_status()
        if response.content:
            return response.json()
        return response.text


def ping() -> str:
    with httpx.Client(timeout=_TIMEOUT) as client:
        response = client.get(_url("/ping"))
        response.raise_for_status()
        return response.text


def get_open_incidents() -> list[dict[str, Any]]:
    return _request("GET", "/open-incidents")


def get_incident_snapshot(incident_id: int) -> dict[str, Any]:
    return _request("GET", f"/incident-snapshot/{incident_id}")


def get_available_resources() -> list[dict[str, Any]]:
    return _request("GET", "/available-resources")


def get_resources_by_org(org_type: str) -> list[dict[str, Any]]:
    return _request("GET", f"/resources-by-org/{org_type.upper()}")


def get_incident_logs(incident_id: int) -> list[dict[str, Any]]:
    return _request("GET", f"/incident-logs/{incident_id}")


def get_nearby_resources(lat: float, lon: float, resource_type: str | None = None, limit: int = 10) -> list[dict[str, Any]]:
    params = {"lat": lat, "lon": lon, "limit": limit}
    if resource_type:
        params["type"] = resource_type
    return _request("GET", "/nearby-resources", params=params)


def get_incident_context(incident_id: int) -> dict[str, Any]:
    """Full incident context; uses dedicated endpoint when available, else snapshot + logs."""
    try:
        return _request("GET", f"/incident-context/{incident_id}")
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code != 404:
            raise
    snapshot = get_incident_snapshot(incident_id)
    logs = get_incident_logs(incident_id)
    logs_sorted = sorted(logs, key=lambda x: x.get("timestamp", ""))
    return {
        "incident": snapshot,
        "timeline": logs_sorted,
    }


def assign_resource(resource_id: int, incident_id: int) -> dict[str, Any]:
    return _request(
        "POST",
        "/assign-resource",
        json={"resourceId": resource_id, "incidentId": incident_id},
    )


def release_resource(resource_id: int) -> dict[str, Any]:
    return _request("POST", "/release-resource", json={"resourceId": resource_id})


def update_incident_status(incident_id: int, status: str) -> dict[str, Any]:
    return _request(
        "POST",
        "/update-incident-status",
        json={"incidentId": str(incident_id), "status": status.upper()},
    )


def update_resource_status(resource_id: int, status: str) -> dict[str, Any]:
    return _request(
        "POST",
        "/update-resource-status",
        json={"resourceId": str(resource_id), "status": status.upper()},
    )


def send_message(
    incident_id: int,
    message: str,
    target_organization: str | None = None,
    requires_action: bool = False,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "incidentId": incident_id,
        "message": message,
        "requiresAction": requires_action,
    }
    if target_organization:
        body["targetOrganization"] = target_organization.upper()
    return _request("POST", "/send-message", json=body)


def log_decision(incident_id: int, decision: str, reason: str) -> dict[str, Any]:
    return _request(
        "POST",
        "/log-decision",
        json={"incidentId": incident_id, "decision": decision, "reason": reason},
    )
