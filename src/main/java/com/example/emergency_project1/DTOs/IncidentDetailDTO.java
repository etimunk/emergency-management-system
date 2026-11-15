package com.example.emergency_project1.DTOs;

import com.example.emergency_project1.entities.IncidentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentDetailDTO {
    private Long id;
    private String description;
    private String locationAddress;
    private double latitude;
    private double longitude;
    private IncidentStatus status;
    private String createdBy;
    private LocalDateTime creationTime;
    private int casualtyCount;
    private List<ResourceWithTeamDTO> assignedResources;
}
