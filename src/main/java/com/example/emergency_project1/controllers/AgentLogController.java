package com.example.emergency_project1.controllers;

import com.example.emergency_project1.entities.AgentDecisionLog;
import com.example.emergency_project1.services.AgentDecisionLogServ;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/agent-logs")
@CrossOrigin(origins = "*")
public class AgentLogController {

    @Autowired
    private AgentDecisionLogServ agentDecisionLogServ;

    @GetMapping
    public ResponseEntity<List<AgentDecisionLog>> getRecentLogs() {
        return ResponseEntity.ok(agentDecisionLogServ.getRecentLogs());
    }

    @GetMapping("/by-incident/{incidentId}")
    public ResponseEntity<List<AgentDecisionLog>> getLogsByIncident(@PathVariable Long incidentId) {
        return ResponseEntity.ok(agentDecisionLogServ.getLogsByIncident(incidentId));
    }
}
