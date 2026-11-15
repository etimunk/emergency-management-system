package com.example.emergency_project1.controllers;

import com.example.emergency_project1.DTOs.IncidentDetailDTO;
import com.example.emergency_project1.entities.Incident;
import com.example.emergency_project1.entities.IncidentStatus;
import com.example.emergency_project1.services.IncidentServ;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@CrossOrigin(origins = "*")
public class IncidentCon {

    @Autowired
    private IncidentServ incidentServ;

    // 1. יצירת אירוע
    @PostMapping
    public Incident create(@RequestBody Incident incident) {
        return incidentServ.createIncident(incident);
    }

    // 2. עדכון אירוע סטטוס
    @PatchMapping("/{id}/status")
    public Incident updateStatus(@PathVariable Long id, @RequestParam IncidentStatus status) {
        return incidentServ.updateStatus(id, status);
    }

    // 3. עדכון אירוע תיאור
    @PatchMapping("/{id}/description")
    public Incident updateDescription(@PathVariable Long id, @RequestParam String description) {
        return incidentServ.updateDescription(id, description);
    }

    // 4. קבלת אירועים על פי זמן
    @GetMapping("/search/by-time")
    public List<Incident> getByTime(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return incidentServ.getByTimeRange(start, end);
    }

    // 5. קבלת אירועים על פי מקום
    @GetMapping("/search/by-location")
    public List<Incident> getByLocation(@RequestParam String address) {
        return incidentServ.getByLocation(address);
    }

    // 6. הוספת משאב לאירוע
    @PostMapping("/{id}/resources/{resourceId}")
    public Incident addResource(@PathVariable Long id, @PathVariable Long resourceId) {
        return incidentServ.addResourceToIncident(id, resourceId);
    }

    // 7. הוספת פצוע לאירוע
    @PostMapping("/{id}/casualties/{casualtyId}")
    public Incident addCasualty(@PathVariable Long id, @PathVariable Integer casualtyId) {
        return incidentServ.addCasualtyToIncident(id, casualtyId);
    }

    // 8. הוספת דיווח (ActionLog) לאירוע
    @PostMapping("/{id}/logs/{logId}")
    public Incident addLog(@PathVariable Long id, @PathVariable Long logId) {
        return incidentServ.addActionLogToIncident(id, logId);
    }

    // 9. מחיקת משאב מאירוע
    @DeleteMapping("/{id}/resources/{resourceId}")
    public Incident removeResource(@PathVariable Long id, @PathVariable Long resourceId) {
        return incidentServ.removeResourceFromIncident(id, resourceId);
    }

    @GetMapping
    public List<Incident> getAll() {
        return incidentServ.getAllIncidents();
    }

    @GetMapping("/{id}")
    public IncidentDetailDTO getById(@PathVariable Long id) {
        return incidentServ.getIncidentDetail(id);
    }
}