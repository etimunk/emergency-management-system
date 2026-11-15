package com.example.emergency_project1.controllers;

import com.example.emergency_project1.DTOs.ActionLogDTO;
import com.example.emergency_project1.entities.ActionLog;
import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.services.ActionLogServ;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/action-logs")
@CrossOrigin(origins = "*")
public class ActionLogCon {

    @Autowired
    private ActionLogServ actionLogServ;

    // --- CRUD בסיסי ---

    @PostMapping
    public org.springframework.http.ResponseEntity<?> create(@RequestBody ActionLog actionLog) {
        try {
            ActionLog created = actionLogServ.createActionLog(actionLog);
            return org.springframework.http.ResponseEntity.ok(created);
        } catch (Exception e) {
            e.printStackTrace();
            return org.springframework.http.ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public List<ActionLog> getAll() {
        return actionLogServ.getAllActionLogs();
    }

    @GetMapping("/{id}")
    public ActionLog getById(@PathVariable Long id) {
        return actionLogServ.getActionLogById(id)
                .orElseThrow(() -> new RuntimeException("Log not found with id: " + id));
    }

    @PutMapping("/{id}")
    public ActionLog update(@PathVariable Long id, @RequestBody ActionLog details) {
        return actionLogServ.updateActionLog(id, details);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        actionLogServ.deleteActionLog(id);
    }

    // --- חיפושים מיוחדים (לפי הפונקציות ב-Service) ---

    // GET /api/action-logs/search/by-org?targetOrganization=MILITARY
    @GetMapping("/search/by-org")
    public List<ActionLog> getByOrg(@RequestParam OrganizationType targetOrganization) {
        return actionLogServ.getActionLogByTargetOrganization(targetOrganization);
    }



    // GET /api/action-logs/search/by-timestamp?timestamp=2026-03-12T15:00:00
    @GetMapping("/search/by-timestamp")
    public List<ActionLog> getByTimestamp(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime timestamp) {
        return actionLogServ.getActionLogByTimestamp(timestamp);
    }
    // קבלת הודעות על פי אירוע
    @GetMapping("/search/by-incident/{incidentId}")
    public List<ActionLogDTO> getByIncident(@PathVariable Long incidentId) {
        return actionLogServ.getActionLogDtosByIncident(incidentId);
    }

    // קבלת הודעות על פי משתמש
    @GetMapping("/search/by-user/{userId}")
    public List<ActionLog> getByUser(@PathVariable Long userId) {
        return actionLogServ.getActionLogsByUser(userId);
    }

    // קבלת הודעות על טווח זמן מסוים
    // דוגמה לקריאה: /api/action-logs/search/range?start=2026-01-01T00:00:00&end=2026-01-02T00:00:00
    @GetMapping("/search/range")
    public List<ActionLog> getByTimeRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return actionLogServ.getActionLogsByTimeRange(start, end);
    }
}