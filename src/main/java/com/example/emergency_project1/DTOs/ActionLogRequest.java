package com.example.emergency_project1.DTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ActionLogRequest {
    private Long incidentId;
    private String message;
    private String targetOrganization;
    private boolean requiresAction;
}
