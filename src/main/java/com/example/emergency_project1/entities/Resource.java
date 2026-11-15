package com.example.emergency_project1.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor

@Entity
@Table(name = "resources")
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Enumerated(EnumType.STRING)
    private OrganizationType orgType;

    private String resourceType;

    private double latitude;
    private double longitude;
    private double speed;
    private double heading;


    @Enumerated(EnumType.STRING)
    private ResourceStatus status;

    @OneToOne
    @JoinColumn(name = "owner_id", unique = true)
    private User resourceOwner;

    @OneToMany(mappedBy = "resource", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JsonIgnore // מונע לולאה
    private List<User> users;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id")
    @JsonIgnore // מניעת לולאה אינסופית ב-JSON
    private Incident currentIncident;
}