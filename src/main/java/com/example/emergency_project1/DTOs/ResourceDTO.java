package com.example.emergency_project1.DTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResourceDTO {
    private Long id;
    private String type; // למשל: "Ambulance", "FireTruck"
    private String status; // למשל: "On Route", "At Scene"
    private String unitName;
}
