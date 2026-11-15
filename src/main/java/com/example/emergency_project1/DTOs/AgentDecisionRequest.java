package com.example.emergency_project1.DTOs;

import lombok.Data;

@Data
public class AgentDecisionRequest {
    private Long incidentId;
    private String decision;
    private String reason;
}
