package com.example.emergency_project1.DTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CasualtyDTO {
    private Long id;
    private String condition; // למשל: "קשה", "קל", "בינוני"
    private String injuryType;
    private String locationInScene;
}