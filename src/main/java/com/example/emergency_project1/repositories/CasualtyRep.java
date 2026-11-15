package com.example.emergency_project1.repositories;
import com.example.emergency_project1.entities.ActionLog;
import com.example.emergency_project1.entities.Casualty;
import com.example.emergency_project1.entities.Incident;
import com.example.emergency_project1.entities.TriageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;


@Repository
public interface CasualtyRep extends JpaRepository<Casualty, Integer> {
    List<Casualty> findByIncidentId(Long incidentId) ;
    List<Casualty> findByCondition(TriageStatus condition);
    Optional<Casualty> findByTz(Long tz);
}
