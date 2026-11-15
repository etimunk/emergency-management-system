package com.example.emergency_project1.controllers;

import com.example.emergency_project1.entities.Casualty;
import com.example.emergency_project1.entities.TriageStatus;
import com.example.emergency_project1.services.CasualtyServ;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/casualties")
@CrossOrigin(origins = "*")
public class CasualtyCon {

    @Autowired
    private CasualtyServ casualtyServ;

    @PostMapping
    public Casualty create(@RequestBody Casualty casualty) {
        return casualtyServ.createCasualty(casualty);
    }

    @PutMapping("/{id}")
    public Casualty update(@PathVariable Integer id, @RequestBody Casualty details) {
        return casualtyServ.updateCasualty(id, details);
    }

    // צפייה בפצועים לפי אירוע
    @GetMapping("/search/by-incident/{incidentId}")
    public List<Casualty> getByIncident(@PathVariable Long incidentId) {
        return casualtyServ.getCasualtiesByIncidentId(incidentId);
    }

    // חיפוש פצוע על פי תעודת זהות
    @GetMapping("/search/by-tz/{tz}")
    public Casualty getByTz(@PathVariable Long tz) {
        return casualtyServ.getCasualtyByTz(tz)
                .orElseThrow(() -> new RuntimeException("Casualty with this TZ not found"));
    }

    // חיפוש פצועים על פי דרגה (TriageStatus)
    @GetMapping("/search/by-condition")
    public List<Casualty> getByCondition(@RequestParam TriageStatus condition) {
        return casualtyServ.getCasualtiesByCondition(condition);
    }
}