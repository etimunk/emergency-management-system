package com.example.emergency_project1.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "resource_assignment_requests")
public class ResourceAssignmentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "resource_id")
    private Resource resource;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_tz", referencedColumnName = "TZ")
    private User user;

    private long requesterTz;

    @Enumerated(EnumType.STRING)
    private AssignmentRequestStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime reviewedAt;

    private Long reviewedByTz;
}
