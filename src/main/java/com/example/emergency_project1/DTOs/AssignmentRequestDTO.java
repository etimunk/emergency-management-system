package com.example.emergency_project1.DTOs;

import com.example.emergency_project1.entities.AssignmentRequestStatus;
import com.example.emergency_project1.entities.ResourceAssignmentRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentRequestDTO {
    private Long id;
    private Long resourceId;
    private String resourceName;
    private Long userTz;
    private String userName;
    private Long requesterTz;
    private String requesterName;
    private AssignmentRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private Long reviewedByTz;

    public static AssignmentRequestDTO from(ResourceAssignmentRequest request) {
        return AssignmentRequestDTO.builder()
                .id(request.getId())
                .resourceId(request.getResource() != null ? request.getResource().getId() : null)
                .resourceName(request.getResource() != null ? request.getResource().getName() : null)
                .userTz(request.getUser() != null ? request.getUser().getTz() : null)
                .userName(request.getUser() != null ? request.getUser().getName() : null)
                .requesterTz(request.getRequesterTz())
                .requesterName(resolveRequesterName(request.getRequesterTz()))
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .reviewedAt(request.getReviewedAt())
                .reviewedByTz(request.getReviewedByTz())
                .build();
    }

    private static String resolveRequesterName(long requesterTz) {
        return null;
    }
}
