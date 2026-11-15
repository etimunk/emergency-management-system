package com.example.emergency_project1.services;

import com.example.emergency_project1.entities.*;
import com.example.emergency_project1.repositories.*;
import com.example.emergency_project1.DTOs.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class IncidentServ {

    @Autowired
    private IncidentRep incidentRep;

    @Autowired
    private ResourceRep resourceRep;

    @Autowired
    private CasualtyRep casualtyRep;

    @Autowired
    private ActionLogRep actionLogRep;

    private final RestTemplate restTemplate = new RestTemplate();
    private final String AGENT_URL = "http://localhost:8000/agent/run";
    private final String AGENT_SECRET = "change-me-shared-with-spring"; // תואם ל-config.py של הסוכן

    // --- לוגיקה עסקית מקורית (עבור IncidentCon) ---

    public Incident createIncident(Incident incident) {
        incident.setCreationTime(LocalDateTime.now());
        if (incident.getStatus() == null) incident.setStatus(IncidentStatus.OPEN);
        Incident savedIncident = incidentRep.save(incident);
        
        // קריאה לסוכן הפייתון
        triggerAgent(savedIncident.getId(), "INCIDENT_CREATED");
        
        return savedIncident;
    }

    public void triggerAgent(Long incidentId, String trigger) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Agent-Secret", AGENT_SECRET);

            Map<String, Object> body = new HashMap<>();
            body.put("incidentId", incidentId);
            body.put("trigger", trigger);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(AGENT_URL, request, String.class);
            System.out.println("Agent triggered successfully: " + response.getBody());
        } catch (Exception e) {
            System.err.println("Failed to trigger agent: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public IncidentDetailDTO getIncidentDetail(Long id) {
        Incident incident = incidentRep.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found with ID: " + id));

        if (incident.getAssignedResources() != null) {
            incident.getAssignedResources().forEach(resource -> {
                if (resource.getUsers() != null) {
                    resource.getUsers().size();
                }
                if (resource.getResourceOwner() != null) {
                    resource.getResourceOwner().getName();
                }
            });
        }

        List<ResourceWithTeamDTO> resources = (incident.getAssignedResources() != null)
                ? incident.getAssignedResources().stream()
                .map(resource -> ResourceWithTeamDTO.builder()
                        .resource(ResourceMapDTO.from(resource))
                        .team(buildTeamList(resource))
                        .build())
                .toList()
                : List.of();

        return IncidentDetailDTO.builder()
                .id(incident.getId())
                .description(incident.getDescription())
                .locationAddress(incident.getLocationAddress())
                .latitude(incident.getLatitude())
                .longitude(incident.getLongitude())
                .status(incident.getStatus())
                .createdBy(incident.getCreatedBy())
                .creationTime(incident.getCreationTime())
                .casualtyCount(incident.getCasualties() != null ? incident.getCasualties().size() : 0)
                .assignedResources(resources)
                .build();
    }

    private List<UserTeamDTO> buildTeamList(Resource resource) {
        List<UserTeamDTO> team = new java.util.ArrayList<>();
        if (resource.getResourceOwner() != null) {
            team.add(UserTeamDTO.from(resource.getResourceOwner()));
        }
        if (resource.getUsers() != null) {
            resource.getUsers().stream()
                    .filter(user -> resource.getResourceOwner() == null
                            || user.getTz() != resource.getResourceOwner().getTz())
                    .map(UserTeamDTO::from)
                    .forEach(team::add);
        }
        return team;
    }

    @Transactional(readOnly = true)
    public List<Incident> getAllIncidents() {
        List<Incident> incidents = incidentRep.findAll();
        incidents.forEach(incident -> {
            if (incident.getAssignedResources() != null) {
                incident.getAssignedResources().size();
            }
        });
        return incidents;
    }

    public Incident updateStatus(Long id, IncidentStatus status) {
        Incident incident = incidentRep.findById(id).orElseThrow(() -> new RuntimeException("Incident not found"));
        incident.setStatus(status);

        // כאשר האירוע נסגר — שחרור אוטומטי של כל המשאבים
        if (status == IncidentStatus.CLOSED && incident.getAssignedResources() != null) {
            for (Resource r : incident.getAssignedResources()) {
                r.setStatus(ResourceStatus.AVAILABLE);
                r.setCurrentIncident(null);
                resourceRep.save(r);
            }
        }

        return incidentRep.save(incident);
    }

    public Incident updateDescription(Long id, String description) {
        Incident incident = incidentRep.findById(id).orElseThrow(() -> new RuntimeException("Incident not found"));
        incident.setDescription(description);
        return incidentRep.save(incident);
    }

    public List<Incident> getByTimeRange(LocalDateTime start, LocalDateTime end) {
        return incidentRep.findByCreationTimeBetween(start, end);
    }

    public List<Incident> getByLocation(String address) {
        return incidentRep.findByLocationAddressContainingIgnoreCase(address);
    }

    @Transactional
    public Incident addResourceToIncident(Long incidentId, Long resourceId) {
        Incident incident = incidentRep.findById(incidentId).orElseThrow(() -> new RuntimeException("Incident not found"));
        Resource resource = resourceRep.findById(resourceId).orElseThrow(() -> new RuntimeException("Resource not found"));
        resource.setCurrentIncident(incident);
        resourceRep.save(resource);
        return incident;
    }

    @Transactional
    public Incident removeResourceFromIncident(Long incidentId, Long resourceId) {
        Resource resource = resourceRep.findById(resourceId).orElseThrow(() -> new RuntimeException("Resource not found"));
        resource.setCurrentIncident(null);
        resourceRep.save(resource);
        return incidentRep.findById(incidentId).orElseThrow(() -> new RuntimeException("Incident not found"));
    }

    @Transactional
    public Incident addCasualtyToIncident(Long incidentId, Integer casualtyId) {
        Incident incident = incidentRep.findById(incidentId).orElseThrow(() -> new RuntimeException("Incident not found"));
        Casualty casualty = casualtyRep.findById(casualtyId).orElseThrow(() -> new RuntimeException("Casualty not found"));
        casualty.setIncident(incident);
        casualtyRep.save(casualty);
        return incident;
    }

    @Transactional
    public Incident addActionLogToIncident(Long incidentId, Long logId) {
        Incident incident = incidentRep.findById(incidentId).orElseThrow(() -> new RuntimeException("Incident not found"));
        ActionLog log = actionLogRep.findById(logId).orElseThrow(() -> new RuntimeException("Log not found"));
        log.setIncident(incident);
        actionLogRep.save(log);
        return incident;
    }

    @Transactional
    public void updateLocation(Long id, double lat, double lon) {
        Incident incident = incidentRep.findById(id).orElseThrow(() -> new RuntimeException("Incident not found"));
        incident.setLatitude(lat);
        incident.setLongitude(lon);
        incidentRep.save(incident);
    }

    // --- משימה מתוזמנת: בדיקת אירועים מעל שעתיים ---
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 60000) // בודק כל דקה
    public void checkStaleIncidents() {
        LocalDateTime twoHoursAgo = LocalDateTime.now().minusHours(2);
        List<Incident> staleIncidents = incidentRep.findByCreationTimeBefore(twoHoursAgo).stream()
                .filter(i -> i.getStatus() == IncidentStatus.OPEN || i.getStatus() == IncidentStatus.IN_PROGRESS)
                .collect(Collectors.toList());

        for (Incident incident : staleIncidents) {
            System.out.println("Incident " + incident.getId() + " is stale (older than 2 hours). Triggering agent...");
            triggerAgent(incident.getId(), "INCIDENT_TIMEOUT");
        }
    }

    // --- לוגיקת MCP (עבור McpController) ---

    @Transactional(readOnly = true)
    public IncidentSummaryDTO getIncidentSnapshotForMcp(Long id) {
        Incident incident = incidentRep.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found with ID: " + id));
        return convertToSummaryDTO(incident);
    }

    @Transactional(readOnly = true)
    public List<IncidentBriefDTO> getOpenIncidentsForMcp() {
        List<Incident> openIncidents = incidentRep.findByStatus(IncidentStatus.OPEN);
        List<Incident> inProgressIncidents = incidentRep.findByStatus(IncidentStatus.IN_PROGRESS);
        openIncidents.addAll(inProgressIncidents);

        return openIncidents.stream().map(i -> new IncidentBriefDTO(
                i.getId(),
                i.getDescription(),
                i.getStatus() != null ? i.getStatus().toString() : "OPEN",
                i.getLocationAddress(),
                i.getCasualties() != null ? i.getCasualties().size() : 0,
                i.getAssignedResources() != null ? i.getAssignedResources().size() : 0,
                i.getCreationTime() != null ? i.getCreationTime().toString() : ""
        )).collect(Collectors.toList());
    }

    private IncidentSummaryDTO convertToSummaryDTO(Incident incident) {
        List<CasualtyDTO> casualtyDTOs = (incident.getCasualties() != null) ?
                incident.getCasualties().stream()
                        .map(c -> new CasualtyDTO(
                                Long.valueOf(c.getId()),
                                c.getCondition() != null ? c.getCondition().toString() : "Unknown",
                                "N/A", "N/A"))
                        .collect(Collectors.toList()) : List.of();
// בתוך IncidentServ.java -> convertToSummaryDTO

        List<ResourceDTO> resourceDTOs = (incident.getAssignedResources() != null) ?
                incident.getAssignedResources().stream()
                        .map(r -> new ResourceDTO(
                                r.getId(),
                                r.getResourceType() != null ? r.getResourceType() : "N/A", // שימוש בשדה הנכון
                                r.getStatus() != null ? r.getStatus().toString() : "N/A",  // שימוש בסטטוס הקיים
                                r.getName() != null ? r.getName() : "Unit " + r.getId()    // שימוש בשם המשאב
                        ))
                        .collect(Collectors.toList()) : List.of();

        return new IncidentSummaryDTO(
                incident.getId(),
                incident.getDescription(),
                incident.getStatus() != null ? incident.getStatus().toString() : "OPEN",
                incident.getLocationAddress(),
                "HIGH",
                casualtyDTOs,
                resourceDTOs,
                casualtyDTOs.size(),
                resourceDTOs.size()
        );
    }
}