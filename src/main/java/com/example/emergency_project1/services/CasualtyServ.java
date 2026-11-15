package com.example.emergency_project1.services;

import com.example.emergency_project1.entities.Casualty;
import com.example.emergency_project1.entities.TriageStatus;
import com.example.emergency_project1.repositories.CasualtyRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CasualtyServ {

    @Autowired
    private CasualtyRep casualtyRep;

    public Casualty createCasualty(Casualty casualty) {
        return casualtyRep.save(casualty);
    }

    public List<Casualty> getAllCasualties() {
        return casualtyRep.findAll();
    }

    // שינוי מ-Long ל-Integer
    public Optional<Casualty> getCasualtyById(Integer id) {
        return casualtyRep.findById(id);
    }

    // שינוי מ-Long ל-Integer
    public Casualty updateCasualty(Integer id, Casualty details) {
        Casualty casualty = casualtyRep.findById(id)
                .orElseThrow(() -> new RuntimeException("Casualty not found"));

        casualty.setTz(details.getTz());
        casualty.setFullName(details.getFullName());
        casualty.setCondition(details.getCondition());
        casualty.setMedicalNotes(details.getMedicalNotes());

        if (details.getIncident() != null) {
            casualty.setIncident(details.getIncident());
        }

        return casualtyRep.save(casualty);
    }

    // חיפוש לפי ת"ז (נשאר Long כי ת"ז היא מספר ארוך)
    public Optional<Casualty> getCasualtyByTz(Long tz) {
        return casualtyRep.findByTz(tz);
    }

    public List<Casualty> getCasualtiesByIncidentId(Long incidentId) {
        return casualtyRep.findByIncidentId(incidentId);
    }

    public List<Casualty> getCasualtiesByCondition(TriageStatus condition) {
        return casualtyRep.findByCondition(condition);
    }
}