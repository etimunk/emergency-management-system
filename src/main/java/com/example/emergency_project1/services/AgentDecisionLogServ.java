package com.example.emergency_project1.services;

import com.example.emergency_project1.entities.AgentDecisionLog;
import com.example.emergency_project1.repositories.AgentDecisionLogRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AgentDecisionLogServ {

    @Autowired
    private AgentDecisionLogRep rep;

    public AgentDecisionLog saveDecision(Long incidentId, String decision, String reason) {
        AgentDecisionLog log = AgentDecisionLog.builder()
                .incidentId(incidentId)
                .decision(decision)
                .reason(reason)
                .timestamp(LocalDateTime.now())
                .build();
        return rep.save(log);
    }

    public List<AgentDecisionLog> getRecentLogs() {
        return rep.findTop50ByOrderByTimestampDesc();
    }

    public List<AgentDecisionLog> getLogsByIncident(Long incidentId) {
        return rep.findByIncidentIdOrderByTimestampDesc(incidentId);
    }
}
