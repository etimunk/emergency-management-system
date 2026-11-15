package com.example.emergency_project1.repositories;

import com.example.emergency_project1.entities.AssignmentRequestStatus;
import com.example.emergency_project1.entities.Resource;
import com.example.emergency_project1.entities.ResourceAssignmentRequest;
import com.example.emergency_project1.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceAssignmentRequestRep extends JpaRepository<ResourceAssignmentRequest, Long> {

    List<ResourceAssignmentRequest> findByStatusOrderByCreatedAtDesc(AssignmentRequestStatus status);

    List<ResourceAssignmentRequest> findByResourceIdAndStatusOrderByCreatedAtDesc(Long resourceId, AssignmentRequestStatus status);

    boolean existsByResourceAndUserAndStatus(Resource resource, User user, AssignmentRequestStatus status);

    Optional<ResourceAssignmentRequest> findByIdAndStatus(Long id, AssignmentRequestStatus status);
}
