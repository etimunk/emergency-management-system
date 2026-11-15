package com.example.emergency_project1.controllers;

import com.example.emergency_project1.DTOs.AssignmentRequestDTO;
import com.example.emergency_project1.DTOs.CreateResourceRequest;
import com.example.emergency_project1.DTOs.ResourceDetailsDTO;
import com.example.emergency_project1.DTOs.ResourceMapDTO;
import com.example.emergency_project1.DTOs.UserTeamDTO;
import com.example.emergency_project1.entities.Resource;
import com.example.emergency_project1.entities.User;
import com.example.emergency_project1.services.ResourceAssignmentServ;
import com.example.emergency_project1.services.ResourceServ;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "*")
public class ResourceCon {

    @Autowired
    private ResourceServ resourceServ;

    @Autowired
    private ResourceAssignmentServ assignmentServ;

    @PostMapping
    public Resource create(@RequestBody CreateResourceRequest request) {
        if (request.getOwnerUserId() == null) {
            throw new RuntimeException("ownerUserId is required — every resource must have a manager");
        }
        Resource resource = Resource.builder()
                .name(request.getName())
                .orgType(request.getOrgType())
                .resourceType(request.getResourceType())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .speed(request.getSpeed())
                .heading(request.getHeading())
                .status(request.getStatus())
                .build();
        return resourceServ.createResourceWithOwner(resource, request.getOwnerUserId());
    }

    @PutMapping("/{id}/details")
    public Resource updateDetails(@PathVariable Long id, @RequestBody Resource details) {
        return resourceServ.updateResourceDetails(id, details);
    }

    @PatchMapping("/{id}/owner")
    public Resource updateOwner(@PathVariable Long id, @RequestParam Long userId) {
        return resourceServ.updateOwner(id, userId);
    }

    @PostMapping("/{id}/users")
    public List<AssignmentRequestDTO> requestTeamAssignments(
            @PathVariable Long id,
            @RequestBody List<Long> userIds,
            @RequestParam Long requesterTz) {
        return assignmentServ.requestTeamAssignments(id, userIds, requesterTz);
    }

    @GetMapping("/{id}/assignment-requests/pending")
    public List<AssignmentRequestDTO> getPendingAssignments(
            @PathVariable Long id,
            @RequestParam Long requesterTz) {
        return assignmentServ.getPendingForResource(id, requesterTz);
    }

    @DeleteMapping("/{id}/users/{userTz}")
    public Resource removeUser(
            @PathVariable Long id,
            @PathVariable Long userTz,
            @RequestParam Long requesterTz) {
        return resourceServ.removeUserFromResource(id, userTz, requesterTz);
    }

    @GetMapping("/{id}/users")
    public List<UserTeamDTO> getResourceUsers(@PathVariable Long id) {
        return resourceServ.getResourceUsers(id).stream()
                .map(UserTeamDTO::from)
                .toList();
    }

    @GetMapping("/{id}/details")
    public ResourceDetailsDTO getResourceDetails(@PathVariable Long id) {
        return resourceServ.getResourceDetails(id);
    }

    @PostMapping("/{id}/team/direct")
    public void adminAddTeam(@PathVariable Long id, @RequestBody List<Long> userIds) {
        resourceServ.adminAddUsersToResource(id, userIds);
    }

    @DeleteMapping("/{id}/team/{userTz}/direct")
    public void adminRemoveTeam(@PathVariable Long id, @PathVariable Long userTz) {
        resourceServ.adminRemoveUserFromResource(id, userTz);
    }

    @GetMapping("/{id}/owner")
    public User getOwner(@PathVariable Long id) {
        User owner = resourceServ.getResourceById(id).getResourceOwner();
        if (owner == null) {
            throw new RuntimeException("Resource has no manager");
        }
        return owner;
    }

    @PatchMapping("/{id}/assign-incident")
    public Resource assignToIncident(@PathVariable Long id, @RequestParam Long incidentId) {
        return resourceServ.assignToIncident(id, incidentId);
    }

    @PatchMapping("/{id}/status")
    public Resource updateStatus(
            @PathVariable Long id,
            @RequestParam com.example.emergency_project1.entities.ResourceStatus status,
            @RequestParam(required = false) Long requesterTz) {
        return resourceServ.updateStatus(id, status, requesterTz);
    }

    @PatchMapping("/{id}/location")
    public Resource updateLocation(
            @PathVariable Long id,
            @RequestParam double lat,
            @RequestParam double lon) {
        return resourceServ.updateLocation(id, lat, lon);
    }

    @GetMapping
    public List<ResourceMapDTO> getAll() {
        return resourceServ.getAllResources().stream()
                .map(ResourceMapDTO::from)
                .toList();
    }

    @DeleteMapping("/{id}")
    public void deleteResource(@PathVariable Long id) {
        resourceServ.deleteResource(id);
    }
}
