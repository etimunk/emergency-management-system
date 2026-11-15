package com.example.emergency_project1.DTOs;

import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.Resource;
import com.example.emergency_project1.entities.ResourceStatus;
import com.example.emergency_project1.entities.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** תשובת API קלה למפה — בלי לולאות JSON של User/Resource */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceMapDTO {
    private Long id;
    private String name;
    private OrganizationType orgType;
    private String resourceType;
    private double latitude;
    private double longitude;
    private double speed;
    private double heading;
    private ResourceStatus status;
    private Long ownerTz;
    private String ownerName;
    private Long incidentId;

    public static ResourceMapDTO from(Resource resource) {
        User owner = resource.getResourceOwner();
        return ResourceMapDTO.builder()
                .id(resource.getId())
                .name(resource.getName())
                .orgType(resource.getOrgType())
                .resourceType(resource.getResourceType())
                .latitude(resource.getLatitude())
                .longitude(resource.getLongitude())
                .speed(resource.getSpeed())
                .heading(resource.getHeading())
                .status(resource.getStatus())
                .ownerTz(owner != null ? owner.getTz() : null)
                .ownerName(owner != null ? owner.getName() : null)
                .incidentId(resource.getCurrentIncident() != null ? resource.getCurrentIncident().getId() : null)
                .build();
    }
}
