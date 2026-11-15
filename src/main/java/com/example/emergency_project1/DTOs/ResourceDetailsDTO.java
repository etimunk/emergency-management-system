package com.example.emergency_project1.DTOs;

import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.Resource;
import com.example.emergency_project1.entities.ResourceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceDetailsDTO {
    private Long id;
    private String name;
    private OrganizationType orgType;
    private String resourceType;
    private double latitude;
    private double longitude;
    private double speed;
    private double heading;
    private ResourceStatus status;
    private Long incidentId;

    private UserTeamDTO owner;
    private List<UserTeamDTO> users;

    public static ResourceDetailsDTO from(Resource resource, UserTeamDTO owner, List<UserTeamDTO> users) {
        return ResourceDetailsDTO.builder()
                .id(resource.getId())
                .name(resource.getName())
                .orgType(resource.getOrgType())
                .resourceType(resource.getResourceType())
                .latitude(resource.getLatitude())
                .longitude(resource.getLongitude())
                .speed(resource.getSpeed())
                .heading(resource.getHeading())
                .status(resource.getStatus())
                .incidentId(resource.getCurrentIncident() != null ? resource.getCurrentIncident().getId() : null)
                .owner(owner)
                .users(users != null ? users : List.of())
                .build();
    }
}