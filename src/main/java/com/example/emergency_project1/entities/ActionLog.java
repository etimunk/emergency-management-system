package com.example.emergency_project1.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
@Data
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor


@Entity
public class ActionLog {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "incident_id")
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    private Incident incident;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    private User sender;
    private String messageContent; // "נדרש סיוע מוסק לפינוי"

    @Enumerated(EnumType.STRING)
    private OrganizationType targetOrganization; // למי הבקשה מיועדת? (MILITARY, FIRE_DEPT)

    private boolean requiresAction; // האם זה Alert שצריך לקפוץ ב-React?
    private LocalDateTime timestamp;
}
