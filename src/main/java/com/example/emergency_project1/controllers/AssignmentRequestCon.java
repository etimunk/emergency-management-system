package com.example.emergency_project1.controllers;

import com.example.emergency_project1.DTOs.AssignmentRequestDTO;
import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.User;
import com.example.emergency_project1.services.ResourceAssignmentServ;
import com.example.emergency_project1.services.UserServ;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignment-requests")
@CrossOrigin(origins = "*")
public class AssignmentRequestCon {

    @Autowired
    private ResourceAssignmentServ assignmentServ;

    @Autowired
    private UserServ userServ;

    @GetMapping("/eligible-members")
    public List<User> eligibleMembers(
            @RequestParam long requesterTz,
            @RequestParam OrganizationType orgType,
            @RequestParam(required = false) Long resourceId) {
        return userServ.getEligibleTeamMembersForManager(requesterTz, orgType, resourceId);
    }

    @GetMapping("/pending")
    public List<AssignmentRequestDTO> getPending() {
        return assignmentServ.getPendingForAdmin();
    }

    @PatchMapping("/{id}/approve")
    public AssignmentRequestDTO approve(@PathVariable Long id, @RequestParam Long adminTz) {
        return assignmentServ.approve(id, adminTz);
    }

    @PatchMapping("/{id}/reject")
    public AssignmentRequestDTO reject(@PathVariable Long id, @RequestParam Long adminTz) {
        return assignmentServ.reject(id, adminTz);
    }
}
