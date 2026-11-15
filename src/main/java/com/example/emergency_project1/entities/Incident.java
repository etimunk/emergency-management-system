package com.example.emergency_project1.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor


@Entity
public class Incident {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description; // למשל: "תאונת שרשרת בכביש 1"
    private String locationAddress; // כתובת טקסטואלית
    private double latitude; // מיקום ל-GPS
    private double longitude;

    @Enumerated(EnumType.STRING)
    private IncidentStatus status; // OPEN, IN_PROGRESS, CLOSED

    private String createdBy; // מי פתח את האירוע (למשל: "Police_User_1")
    private LocalDateTime creationTime;

    // קשר לפצועים: אירוע אחד יכול להכיל הרבה פצועים
    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL)
    private List<Casualty> casualties;

    // קשר ללוג פעולות: היסטוריית הדיווחים והבקשות
    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL)
    private List<ActionLog> actionLogs;

    @OneToMany(mappedBy = "currentIncident", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @ToString.Exclude // מומלץ למנוע רקורסיה ב-ToString
    private List<Resource> assignedResources;

}
