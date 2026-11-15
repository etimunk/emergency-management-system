package com.example.emergency_project1.repositories;

import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.Resource;
import com.example.emergency_project1.entities.ResourceStatus;
import com.example.emergency_project1.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRep extends JpaRepository<Resource, Long> {

    List<Resource> findByOrgType(OrganizationType orgType);
    List<Resource> findByStatus(ResourceStatus status);

    @Query("SELECT r FROM Resource r LEFT JOIN FETCH r.currentIncident WHERE r.status = :status")
    List<Resource> findByStatusWithIncident(@Param("status") ResourceStatus status);
    List<Resource> findByOrgTypeAndStatus(OrganizationType orgType, ResourceStatus status);
    List<Resource> findByNameContainingIgnoreCase(String name);
    List<Resource> findByLatitudeAndLongitude(double latitude, double longitude);
    Optional<Resource> findByResourceOwner(User owner);

    boolean existsByName(String name);

    Optional<Resource> findByName(String name);
    long countByStatus(ResourceStatus status);
    List<Resource> findByResourceType(String resourceType);

    List<Resource> findByResourceOwnerIsNull();
}