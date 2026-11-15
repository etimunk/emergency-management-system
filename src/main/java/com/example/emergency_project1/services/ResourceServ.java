package com.example.emergency_project1.services;

import com.example.emergency_project1.DTOs.ResourceDTO;
import com.example.emergency_project1.DTOs.UserTeamDTO;
import com.example.emergency_project1.entities.*;
import com.example.emergency_project1.repositories.IncidentRep;
import com.example.emergency_project1.repositories.ResourceRep;
import com.example.emergency_project1.repositories.UserRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class ResourceServ {

    @Autowired
    private ResourceRep resourceRep;

    @Autowired
    private UserRep userRep;

    @Autowired
    private IncidentRep incidentRep;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * @deprecated השתמש ב-createResourceWithOwner — אין ליצור משאב ללא מנהל
     */
    @Transactional
    public Resource createResource(Resource resource) {
        throw new RuntimeException("Cannot create resource without owner. Use createResourceWithOwner.");
    }

    @Transactional
    public Resource createResourceWithOwner(Resource resource, long ownerTz) {
        if (resource.getName() == null || resource.getName().isBlank()) {
            throw new RuntimeException("Resource name is required");
        }
        if (resourceRep.existsByName(resource.getName())) {
            throw new RuntimeException("Resource already exists");
        }
        User owner = userRep.findByTz(ownerTz);
        if (owner == null) {
            throw new RuntimeException("Owner user not found");
        }
        validateEligibleNewOwner(owner);

        // אכיפת גוש דן — לא לאפשר יצירת משאב מחוץ לרדיוס 20 ק"מ
        double dist = calculateDistance(32.0853, 34.7818, resource.getLatitude(), resource.getLongitude());
        if (dist > 20.0) {
            throw new RuntimeException("Resource location must be within Gush Dan area (max 20km from Tel Aviv center)");
        }

        if (resource.getStatus() == null) {
            resource.setStatus(ResourceStatus.AVAILABLE);
        }
        Resource saved = resourceRep.save(resource);
        applyOwner(saved, owner);
        return saved;
    }

    public Resource getResourceById(Long id) {
        return resourceRep.findById(id).orElseThrow(() -> new RuntimeException("Resource not found"));
    }

    public Resource updateResourceDetails(Long id, Resource details) {
        Resource resource = getResourceById(id);
        resource.setName(details.getName());
        resource.setResourceType(details.getResourceType());
        resource.setOrgType(details.getOrgType());
        if (details.getStatus() != null) {
            resource.setStatus(details.getStatus());
        }
        resource.setLatitude(details.getLatitude());
        resource.setLongitude(details.getLongitude());
        return resourceRep.save(resource);
    }

    @Transactional
    public Resource updateOwner(Long resourceId, Long userId) {
        Resource resource = getResourceById(resourceId);
        User newOwner = userRep.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        if (resource.getResourceOwner() != null && resource.getResourceOwner().getTz() == userId) {
            return resource;
        }

        validateEligibleNewOwner(newOwner);
        clearPreviousOwner(resource);
        applyOwner(resource, newOwner);
        return resource;
    }

    @Transactional
    public Resource addUsersToResource(Long resourceId, List<Long> userIds, Long requesterTz) {
        throw new RuntimeException("Team assignment requires admin approval. Use assignment request API.");
    }

    @Transactional
    public void applyTeamMembersDirect(Long resourceId, List<Long> userIds, Long requesterTz) {
        Resource resource = getResourceById(resourceId);
        validateRequesterIsOwner(resource, requesterTz);
        for (Long userId : userIds) {
            User user = userRep.findByTz(userId);
            if (user == null) {
                throw new RuntimeException("User not found: " + userId);
            }
            validateEligibleTeamMember(user, resource);
            user.setResource(resource);
            userRep.save(user);
        }
    }

    public void validateRequesterIsOwnerPublic(Resource resource, Long requesterTz) {
        validateRequesterIsOwner(resource, requesterTz);
    }

    public void validateEligibleTeamMemberPublic(User user, Resource resource) {
        validateEligibleTeamMember(user, resource);
    }

    public void applyTeamMemberPublic(Resource resource, User user) {
        user.setResource(resource);
        userRep.save(user);
    }

    @Transactional
    public Resource removeUserFromResource(Long resourceId, Long userTz, Long requesterTz) {
        Resource resource = getResourceById(resourceId);
        validateRequesterIsOwner(resource, requesterTz);

        User user = userRep.findByTz(userTz);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        if (resource.getResourceOwner() != null && resource.getResourceOwner().getTz() == userTz) {
            throw new RuntimeException("Cannot remove resource manager from their resource");
        }
        if (user.getResource() == null || !user.getResource().getId().equals(resourceId)) {
            throw new RuntimeException("User is not assigned to this resource");
        }
        user.setResource(null);
        userRep.save(user);
        return resource;
    }

    public List<User> getResourceUsers(Long resourceId) {
        return getResourceById(resourceId).getUsers();
    }

    @Transactional
    public void adminAddUsersToResource(Long resourceId, List<Long> userIds) {
        Resource resource = getResourceById(resourceId);
        for (Long userId : userIds) {
            User user = userRep.findByTz(userId);
            if (user == null) continue;
            validateEligibleTeamMember(user, resource);
            user.setResource(resource);
            userRep.save(user);
        }
    }

    @Transactional
    public void adminRemoveUserFromResource(Long resourceId, Long userTz) {
        User user = userRep.findByTz(userTz);
        if (user == null || user.getResource() == null || !user.getResource().getId().equals(resourceId)) {
            throw new RuntimeException("User is not assigned to this resource");
        }
        user.setResource(null);
        userRep.save(user);
    }

    @Transactional(readOnly = true)
    public com.example.emergency_project1.DTOs.ResourceDetailsDTO getResourceDetails(Long resourceId) {
        Resource resource = getResourceById(resourceId);
        UserTeamDTO ownerDto = resource.getResourceOwner() != null
                ? UserTeamDTO.from(resource.getResourceOwner())
                : null;
        List<UserTeamDTO> usersDto = resource.getUsers() != null
                ? resource.getUsers().stream().map(UserTeamDTO::from).toList()
                : List.of();
        return com.example.emergency_project1.DTOs.ResourceDetailsDTO.from(resource, ownerDto, usersDto);
    }

    @Transactional
    public Resource assignToIncident(Long resourceId, Long incidentId) {
        Resource resource = getResourceById(resourceId);
        if (resource.getResourceOwner() == null) {
            throw new RuntimeException("Resource has no manager — cannot assign to incident");
        }
        Incident incident = incidentRep.findById(incidentId).orElseThrow(() -> new RuntimeException("Incident not found"));
        resource.setCurrentIncident(incident);
        resource.setStatus(ResourceStatus.BUSY);
        return resourceRep.save(resource);
    }

    public Resource updateStatus(Long id, ResourceStatus status) {
        return updateStatus(id, status, null);
    }

    @Transactional
    public Resource updateStatus(Long id, ResourceStatus status, Long requesterTz) {
        Resource resource = getResourceById(id);
        if (requesterTz != null) {
            validateRequesterIsOwner(resource, requesterTz);
        }
        resource.setStatus(status);
        Resource saved = resourceRep.save(resource);

        // שליחת הודעה לסוכן AI דרך WebSocket
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/updates", Map.of(
                    "type", "RESOURCE_STATUS_CHANGED",
                    "payload", Map.of(
                            "resourceId", saved.getId(),
                            "name", saved.getName(),
                            "status", saved.getStatus().name()
                    )
            ));
        }

        return saved;
    }

    public Resource updateLocation(Long id, double lat, double lon) {
        Resource resource = getResourceById(id);
        resource.setLatitude(lat);
        resource.setLongitude(lon);
        return resourceRep.save(resource);
    }

    public List<Resource> getAvailableResourcesForMcp() {
        return resourceRep.findByStatus(ResourceStatus.AVAILABLE);
    }

    public List<ResourceDTO> getResourcesByOrgForMcp(OrganizationType orgType) {
        return resourceRep.findByOrgType(orgType).stream()
                .map(r -> new ResourceDTO(
                        r.getId(),
                        r.getResourceType(),
                        r.getStatus() != null ? r.getStatus().toString() : "UNKNOWN",
                        r.getName()
                ))
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Resource> getAllResources() {
        List<Resource> resources = resourceRep.findAll();
        resources.forEach(r -> {
            if (r.getResourceOwner() != null) {
                r.getResourceOwner().getName();
            }
        });
        return resources;
    }

    public List<ResourceDTO> getNearbyAvailableResources(double lat, double lon, String type, int limit) {
        List<Resource> available = resourceRep.findByStatus(ResourceStatus.AVAILABLE);

        if (type != null && !type.isEmpty()) {
            available = available.stream()
                    .filter(r -> r.getResourceType().equalsIgnoreCase(type))
                    .collect(java.util.stream.Collectors.toList());
        }

        return available.stream()
                .sorted((r1, r2) -> {
                    double d1 = calculateDistance(lat, lon, r1.getLatitude(), r1.getLongitude());
                    double d2 = calculateDistance(lat, lon, r2.getLatitude(), r2.getLongitude());
                    return Double.compare(d1, d2);
                })
                .limit(limit)
                .map(r -> new ResourceDTO(
                        r.getId(),
                        r.getResourceType(),
                        r.getStatus() != null ? r.getStatus().toString() : "UNKNOWN",
                        r.getName()))
                .collect(java.util.stream.Collectors.toList());
    }

    private void validateEligibleNewOwner(User user) {
        if (resourceRep.findByResourceOwner(user).isPresent()) {
            throw new RuntimeException("User is already a resource manager");
        }
        if (user.getResource() != null) {
            throw new RuntimeException("User is already assigned to a resource as team member");
        }
    }

    private void validateEligibleTeamMember(User user, Resource resource) {
        if (user.getRole() != Role.PARAMEDIC) {
            throw new RuntimeException("Only paramedics can be assigned to a resource team: " + user.getTz());
        }
        if (resourceRep.findByResourceOwner(user).isPresent()) {
            throw new RuntimeException("Cannot assign a resource manager as team member: " + user.getTz());
        }
        if (resource.getResourceOwner() != null && user.getTz() == resource.getResourceOwner().getTz()) {
            throw new RuntimeException("Resource manager cannot be assigned as their own team member");
        }
        if (user.getResource() != null && !user.getResource().getId().equals(resource.getId())) {
            throw new RuntimeException("User is already assigned to another resource: " + user.getTz());
        }
        if (user.getOrgType() == null || resource.getOrgType() == null
                || user.getOrgType() != resource.getOrgType()) {
            throw new RuntimeException("User org must match resource org: " + user.getTz());
        }
    }

    private void validateRequesterIsOwner(Resource resource, Long requesterTz) {
        if (requesterTz == null) {
            throw new RuntimeException("Requester identity is required");
        }
        if (resource.getResourceOwner() == null) {
            throw new RuntimeException("Resource has no manager");
        }
        if (resource.getResourceOwner().getTz() != requesterTz) {
            throw new RuntimeException("Only the resource manager can perform this action");
        }
    }

    private void clearPreviousOwner(Resource resource) {
        if (resource.getResourceOwner() != null) {
            User previous = resource.getResourceOwner();
            if (previous.getResource() != null
                    && previous.getResource().getId().equals(resource.getId())) {
                previous.setResource(null);
                userRep.save(previous);
            }
        }
    }

    private void applyOwner(Resource resource, User owner) {
        resource.setResourceOwner(owner);
        owner.setResource(resource);
        resourceRep.save(resource);
        userRep.save(owner);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Transactional
    public void deleteResource(Long id) {
        Resource resource = getResourceById(id);
        User owner = resource.getResourceOwner();
        if (owner != null) {
            owner.setResource(null);
            owner.setOwnedResource(null);
            userRep.save(owner);
        }
        List<User> users = resource.getUsers();
        if (users != null) {
            for (User user : users) {
                user.setResource(null);
                userRep.save(user);
            }
        }
        resourceRep.delete(resource);
    }
}
