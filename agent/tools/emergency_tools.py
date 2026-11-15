"""LangChain tools wrapping mcp_client — bind in agent/graph.py (phase C/D)."""

from __future__ import annotations

from langchain_core.tools import tool

import mcp_client


@tool
def tool_ping() -> str:
    """Check that Spring MCP API is reachable."""
    return mcp_client.ping()


@tool
def tool_get_open_incidents() -> list:
    """List all open and in-progress incidents."""
    return mcp_client.get_open_incidents()


@tool
def tool_get_incident_snapshot(incident_id: int) -> dict:
    """Full snapshot for one incident: description, casualties, resources, status."""
    return mcp_client.get_incident_snapshot(incident_id)


@tool
def tool_get_incident_logs(incident_id: int) -> list:
    """Action log / field reports for an incident."""
    return mcp_client.get_incident_logs(incident_id)


@tool
def tool_get_nearby_resources(lat: float, lon: float, resource_type: str = "", limit: int = 10) -> list:
    """
    Find available resources near a location, sorted by distance.
    resource_type is optional (e.g., 'AMBULANCE', 'FIRE_TRUCK').
    """
    r_type = resource_type.strip() or None
    return mcp_client.get_nearby_resources(lat, lon, r_type, limit)


@tool
def tool_get_available_resources() -> list:
    """All resources currently in AVAILABLE status."""
    return mcp_client.get_available_resources()


@tool
def tool_assign_resource(resource_id: int, incident_id: int) -> dict:
    """Assign a resource to an incident and set status EN_ROUTE."""
    return mcp_client.assign_resource(resource_id, incident_id)


@tool
def tool_send_message(
    incident_id: int,
    message: str,
    target_organization: str = "",
    requires_action: bool = False,
) -> dict:
    """Post a message to the incident action log for field teams / UI."""
    org = target_organization.strip() or None
    return mcp_client.send_message(incident_id, message, org, requires_action)


@tool
def tool_update_incident_status(incident_id: int, status: str) -> dict:
    """Update the status of an incident (e.g., 'OPEN', 'IN_PROGRESS', 'CLOSED')."""
    return mcp_client.update_incident_status(incident_id, status)


ALL_TOOLS = [
    tool_ping,
    tool_get_open_incidents,
    tool_get_incident_snapshot,
    tool_get_incident_logs,
    tool_get_nearby_resources,
    tool_get_available_resources,
    tool_assign_resource,
    tool_send_message,
    tool_update_incident_status,
]
