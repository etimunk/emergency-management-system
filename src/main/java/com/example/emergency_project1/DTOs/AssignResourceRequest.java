package com.example.emergency_project1.DTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AssignResourceRequest {
    private Long resourceId;
    private Long incidentId;
}
