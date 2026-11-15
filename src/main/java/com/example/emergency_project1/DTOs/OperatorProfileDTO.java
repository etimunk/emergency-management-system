package com.example.emergency_project1.DTOs;

import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperatorProfileDTO {
    private long tz;
    private String name;
    private Role role;
    private OrganizationType orgType;
    private boolean resourceOwner;
    private ResourceMapDTO managedResource;
    /** המשאב שהיוזר משויך אליו כצוות (אם אינו מנהל) */
    private ResourceMapDTO assignedResource;
}
