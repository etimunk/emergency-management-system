package com.example.emergency_project1.controllers;

import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.User;
import com.example.emergency_project1.repositories.UserRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TestCon {
    @Autowired
    private UserRep userRep;

    @GetMapping("/api/test/users")
    public List<User> getUsers() {
        return userRep.findAll();
    }

    @GetMapping("/api/test/eligible")
    public List<User> getEligible(@RequestParam OrganizationType orgType, @RequestParam long managerTz) {
        return userRep.findAssignableCandidatesByOrg(orgType, managerTz, com.example.emergency_project1.entities.Role.PARAMEDIC, com.example.emergency_project1.entities.AssignmentRequestStatus.PENDING);
    }
}
