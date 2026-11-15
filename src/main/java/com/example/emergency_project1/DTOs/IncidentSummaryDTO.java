package com.example.emergency_project1.DTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentSummaryDTO {
    private Long id;
    private String description;
    private String status; // "Active", "Resolved"
    private String location;
    private String severity;

    // רשימות של ה-DTOs האחרים
    private List<CasualtyDTO> casualties;
    private List<ResourceDTO> resources;

    // סיכום מהיר לסוכן
    private int totalCasualties;
    private int activeResources;
}
