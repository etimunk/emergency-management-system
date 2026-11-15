package com.example.emergency_project1.repositories;

import com.example.emergency_project1.entities.ActionLog;
import com.example.emergency_project1.entities.Incident;
import com.example.emergency_project1.entities.Casualty;
import com.example.emergency_project1.entities.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IncidentRep extends JpaRepository<Incident, Long> {
    List<Incident> findByStatus(IncidentStatus status);
    List<Incident> findByCreationTimeBetween(LocalDateTime start, LocalDateTime end);
    List<Incident> findByCreationTimeBefore(LocalDateTime time);
    List<Incident> findByLocationAddressContainingIgnoreCase(String address);
    List<Incident> findByCasualtiesContaining(Casualty casualty);
    List<Incident> findByActionLogsContaining(ActionLog actionLog);
}