package com.example.emergency_project1.DTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentBriefDTO {
    private Long id;
    private String description;
    private String status;
    private String location;
    private int casualtyCount;
    private int resourceCount;
    private String creationTime;
}
