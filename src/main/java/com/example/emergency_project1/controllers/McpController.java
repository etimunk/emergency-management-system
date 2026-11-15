package com.example.emergency_project1.controllers;

import com.example.emergency_project1.DTOs.*;
import com.example.emergency_project1.entities.*;
import com.example.emergency_project1.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mcp")
@CrossOrigin(origins = "*")
public class McpController {

    @Autowired
    private IncidentServ incidentServ;

    @Autowired
    private ResourceServ resourceServ;

    @Autowired
    private CasualtyServ casualtyServ;

    @Autowired
    private ActionLogServ actionLogServ;

    @Autowired
    private AgentDecisionLogServ agentDecisionLogServ;

    // ==================== READ TOOLS ====================

    @GetMapping("/incident-context/{id}")
    public ResponseEntity<Map<String, Object>> getIncidentContext(@PathVariable Long id) {
        IncidentSummaryDTO snapshot = incidentServ.getIncidentSnapshotForMcp(id);
        List<ActionLog> logs = actionLogServ.getActionLogByIncident(id);
        
        List<Map<String, Object>> timeline = logs.stream()
                .map(log -> Map.<String, Object>of(
                        "id", log.getId(),
                        "message", log.getMessageContent(),
                        "targetOrg", log.getTargetOrganization() != null ? log.getTargetOrganization().name() : "ALL",
                        "requiresAction", log.isRequiresAction(),
                        "timestamp", log.getTimestamp() != null ? log.getTimestamp().toString() : ""
                ))
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(Map.of(
                "incident", snapshot,
                "timeline", timeline
        ));
    }
    @GetMapping("/ping")
    public String ping() {
        return "MCP Server is up and running!";
    }

    @GetMapping("/incident-snapshot/{id}")
    public ResponseEntity<IncidentSummaryDTO> getIncidentSnapshot(@PathVariable Long id) {
        IncidentSummaryDTO snapshot = incidentServ.getIncidentSnapshotForMcp(id);
        return ResponseEntity.ok(snapshot);
    }

    @GetMapping("/available-resources")
    public ResponseEntity<List<ResourceDTO>> getAvailableResources() {
        List<ResourceDTO> available = resourceServ.getAvailableResourcesForMcp().stream()
                .map(r -> new ResourceDTO(
                        r.getId(),
                        r.getResourceType(),
                        r.getStatus().toString(),
                        r.getName()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(available);
    }

    @GetMapping("/open-incidents")
    public ResponseEntity<List<IncidentBriefDTO>> getOpenIncidents() {
        List<IncidentBriefDTO> incidents = incidentServ.getOpenIncidentsForMcp();
        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/resources-by-org/{orgType}")
    public ResponseEntity<List<ResourceDTO>> getResourcesByOrg(@PathVariable String orgType) {
        OrganizationType org = OrganizationType.valueOf(orgType.toUpperCase());
        List<ResourceDTO> resources = resourceServ.getResourcesByOrgForMcp(org);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/incident-logs/{incidentId}")
    public ResponseEntity<List<Map<String, Object>>> getIncidentLogs(@PathVariable Long incidentId) {
        List<ActionLog> logs = actionLogServ.getActionLogByIncident(incidentId);
        List<Map<String, Object>> result = logs.stream()
                .map(log -> Map.<String, Object>of(
                        "id", log.getId(),
                        "message", log.getMessageContent(),
                        "targetOrg", log.getTargetOrganization() != null ? log.getTargetOrganization().name() : "ALL",
                        "requiresAction", log.isRequiresAction(),
                        "timestamp", log.getTimestamp() != null ? log.getTimestamp().toString() : ""
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/nearby-resources")
    public ResponseEntity<List<ResourceDTO>> getNearbyResources(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "10") int limit) {
        List<ResourceDTO> resources = resourceServ.getNearbyAvailableResources(lat, lon, type, limit);
        return ResponseEntity.ok(resources);
    }

    // ==================== ACTION TOOLS ====================

    @PostMapping("/assign-resource")
    public ResponseEntity<Map<String, Object>> assignResource(@RequestBody AssignResourceRequest request) {
        Resource resource = resourceServ.assignToIncident(request.getResourceId(), request.getIncidentId());
        resourceServ.updateStatus(resource.getId(), ResourceStatus.EN_ROUTE);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Resource " + resource.getName() + " assigned to incident " + request.getIncidentId(),
                "resourceId", resource.getId(),
                "status", "EN_ROUTE"
        ));
    }

    @PostMapping("/release-resource")
    public ResponseEntity<Map<String, Object>> releaseResource(@RequestBody Map<String, Long> body) {
        Long resourceId = body.get("resourceId");
        Resource resource = resourceServ.getResourceById(resourceId);
        resource.setCurrentIncident(null);
        resource.setStatus(ResourceStatus.AVAILABLE);
        resourceServ.updateStatus(resourceId, ResourceStatus.AVAILABLE);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Resource " + resource.getName() + " released and set to AVAILABLE"
        ));
    }

    @PostMapping("/update-incident-status")
    public ResponseEntity<Map<String, Object>> updateIncidentStatus(@RequestBody Map<String, String> body) {
        Long incidentId = Long.parseLong(body.get("incidentId"));
        IncidentStatus status = IncidentStatus.valueOf(body.get("status").toUpperCase());
        incidentServ.updateStatus(incidentId, status);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Incident " + incidentId + " status updated to " + status
        ));
    }

    @PostMapping("/send-message")
    public ResponseEntity<Map<String, Object>> sendActionLog(@RequestBody ActionLogRequest request) {
        ActionLog log = new ActionLog();
        Incident incident = incidentServ.getAllIncidents().stream()
                .filter(i -> i.getId().equals(request.getIncidentId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        log.setIncident(incident);
        log.setMessageContent(request.getMessage());
        log.setRequiresAction(request.isRequiresAction());
        log.setTimestamp(LocalDateTime.now());

        if (request.getTargetOrganization() != null && !request.getTargetOrganization().isEmpty()) {
            log.setTargetOrganization(OrganizationType.valueOf(request.getTargetOrganization().toUpperCase()));
        }

        ActionLog saved = actionLogServ.createActionLog(log);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Action log created for incident " + request.getIncidentId(),
                "logId", saved.getId()
        ));
    }

    @PostMapping("/update-resource-status")
    public ResponseEntity<Map<String, Object>> updateResourceStatus(@RequestBody Map<String, String> body) {
        Long resourceId = Long.parseLong(body.get("resourceId"));
        ResourceStatus status = ResourceStatus.valueOf(body.get("status").toUpperCase());
        resourceServ.updateStatus(resourceId, status);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Resource " + resourceId + " status updated to " + status
        ));
    }

    @PostMapping("/update-incident-location")
    public ResponseEntity<Map<String, Object>> updateIncidentLocation(@RequestBody Map<String, Object> body) {
        Long incidentId = Long.valueOf(body.get("incidentId").toString());
        double lat = Double.parseDouble(body.get("lat").toString());
        double lon = Double.parseDouble(body.get("lon").toString());
        
        incidentServ.updateLocation(incidentId, lat, lon);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Incident " + incidentId + " location updated to " + lat + ", " + lon
        ));
    }

    @PostMapping("/log-decision")
    public ResponseEntity<Map<String, Object>> logDecision(@RequestBody AgentDecisionRequest request) {
        AgentDecisionLog saved = agentDecisionLogServ.saveDecision(
                request.getIncidentId(),
                request.getDecision(),
                request.getReason()
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Decision logged successfully",
                "logId", saved.getId()
        ));
    }
}
