package com.example.emergency_project1.DTOs;

import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private long tz;
    private String name;
    private Role role;
    private OrganizationType orgType;
    private String password;
}
