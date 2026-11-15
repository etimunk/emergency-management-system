package com.example.emergency_project1.repositories;

import com.example.emergency_project1.entities.AgentDecisionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgentDecisionLogRep extends JpaRepository<AgentDecisionLog, Long> {
    List<AgentDecisionLog> findTop50ByOrderByTimestampDesc();

    List<AgentDecisionLog> findByIncidentIdOrderByTimestampDesc(Long incidentId);
}
