package com.example.emergency_project1.DTOs;

import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.ResourceStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateResourceRequest {
    private String name;
    private OrganizationType orgType;
    private String resourceType;
    private double latitude;
    private double longitude;
    private double speed;
    private double heading;
    private ResourceStatus status;
    /** חובה — אין משאב בלי מנהל */
    private Long ownerUserId;
}
