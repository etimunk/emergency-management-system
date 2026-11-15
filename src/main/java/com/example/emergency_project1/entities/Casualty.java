package com.example.emergency_project1.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor


@Entity
public class Casualty {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long tz; // תעודת זהות של הפצוע (אם ידועה)
    private String fullName; // "אלמוני" אם לא ידוע

    @Enumerated(EnumType.STRING)
    private TriageStatus condition; // RED (אנוש), YELLOW (בינוני), GREEN (קל), BLACK (נפטר)

    private String medicalNotes; // "לכוד ברכב", "זקוק להנשמה"

    @ManyToOne
    @JoinColumn(name = "incident_id")
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    private Incident incident; // שיוך לאירוע ספציפי


}
