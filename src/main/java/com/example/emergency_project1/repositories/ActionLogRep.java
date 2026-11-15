package com.example.emergency_project1.repositories;

import com.example.emergency_project1.entities.ActionLog;
import com.example.emergency_project1.entities.OrganizationType; // ייבוא ה-Enum
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActionLogRep extends JpaRepository<ActionLog, Long> {

    List<ActionLog> findByIncident_IdOrderByTimestampDesc(Long incidentId);

    List<ActionLog> findByTargetOrganization(OrganizationType targetOrganization);

    List<ActionLog> findBySenderTz(long userTz);

    // חיפוש בטווח זמן (בין התחלה לסוף)
    List<ActionLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    List<ActionLog> findByTimestamp(LocalDateTime timestamp);
}