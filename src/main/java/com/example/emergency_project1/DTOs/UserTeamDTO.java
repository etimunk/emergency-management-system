package com.example.emergency_project1.DTOs;

import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.Role;
import com.example.emergency_project1.entities.User;
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
public class UserTeamDTO {
    private long tz;
    private String name;
    private Role role;
    private OrganizationType orgType;

    public static UserTeamDTO from(User user) {
        return UserTeamDTO.builder()
                .tz(user.getTz())
                .name(user.getName())
                .role(user.getRole())
                .orgType(user.getOrgType())
                .build();
    }
}
