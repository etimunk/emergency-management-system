package com.example.emergency_project1.services;

import com.example.emergency_project1.DTOs.AssignmentRequestDTO;
import com.example.emergency_project1.entities.*;
import com.example.emergency_project1.repositories.ResourceAssignmentRequestRep;
import com.example.emergency_project1.repositories.UserRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;



@Service
public class ResourceAssignmentServ {

    @Autowired
    private ResourceAssignmentRequestRep requestRep;

    @Autowired
    private UserRep userRep;

    @Autowired
    @Lazy
    private ResourceServ resourceServ;

    @Transactional
    public List<AssignmentRequestDTO> requestTeamAssignments(Long resourceId, List<Long> userIds, Long requesterTz) {
        Resource resource = resourceServ.getResourceById(resourceId);
        resourceServ.validateRequesterIsOwnerPublic(resource, requesterTz);

        if (userIds == null || userIds.isEmpty()) {
            throw new RuntimeException("No users to assign");
        }

        List<AssignmentRequestDTO> created = new ArrayList<>();
        for (Long userId : userIds) {
            User user = userRep.findByTz(userId);
            if (user == null) {
                throw new RuntimeException("User not found: " + userId);
            }
            resourceServ.validateEligibleTeamMemberPublic(user, resource);

            if (requestRep.existsByResourceAndUserAndStatus(resource, user, AssignmentRequestStatus.PENDING)) {
                throw new RuntimeException("Assignment request already pending for user: " + userId);
            }

            ResourceAssignmentRequest request = ResourceAssignmentRequest.builder()
                    .resource(resource)
                    .user(user)
                    .requesterTz(requesterTz)
                    .status(AssignmentRequestStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();
            created.add(toDto(requestRep.save(request)));
        }
        return created;
    }

    private AssignmentRequestDTO toDto(ResourceAssignmentRequest request) {
        AssignmentRequestDTO dto = AssignmentRequestDTO.from(request);
        User requester = userRep.findByTz(request.getRequesterTz());
        if (requester != null) {
            dto.setRequesterName(requester.getName());
        }
        return dto;
    }

    @Transactional(readOnly = true)
    public List<AssignmentRequestDTO> getPendingForAdmin() {
        return requestRep.findByStatusOrderByCreatedAtDesc(AssignmentRequestStatus.PENDING).stream()
                .filter(req -> req.getUser().getResource() == null || !req.getUser().getResource().getId().equals(req.getResource().getId())) // לא להציג אם כבר משויך
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssignmentRequestDTO> getPendingForResource(Long resourceId, Long requesterTz) {
        Resource resource = resourceServ.getResourceById(resourceId);
        resourceServ.validateRequesterIsOwnerPublic(resource, requesterTz);
        return requestRep.findByResourceIdAndStatusOrderByCreatedAtDesc(resourceId, AssignmentRequestStatus.PENDING)
                .stream()
                .filter(req -> req.getUser().getResource() == null || !req.getUser().getResource().getId().equals(resourceId)) // לא להציג אם כבר משויך
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public AssignmentRequestDTO approve(Long requestId, long adminTz) {
        ResourceAssignmentRequest request = requestRep.findByIdAndStatus(requestId, AssignmentRequestStatus.PENDING)
                .orElseThrow(() -> new RuntimeException("Pending assignment request not found"));

        User user = request.getUser();
        Resource resource = request.getResource();
        resourceServ.validateEligibleTeamMemberPublic(user, resource);
        resourceServ.applyTeamMemberPublic(resource, user);

        request.setStatus(AssignmentRequestStatus.APPROVED);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedByTz(adminTz);
        return toDto(requestRep.save(request));
    }

    @Transactional
    public AssignmentRequestDTO reject(Long requestId, long adminTz) {
        ResourceAssignmentRequest request = requestRep.findByIdAndStatus(requestId, AssignmentRequestStatus.PENDING)
                .orElseThrow(() -> new RuntimeException("Pending assignment request not found"));

        request.setStatus(AssignmentRequestStatus.REJECTED);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedByTz(adminTz);
        return toDto(requestRep.save(request));
    }

    /** שימוש פנימי ל-seed — שיוך ישיר בלי אישור */
    @Transactional
    public void applyDirectAssignment(Long resourceId, List<Long> userIds, Long ownerTz) {
        resourceServ.applyTeamMembersDirect(resourceId, userIds, ownerTz);
    }
}
