package com.example.emergency_project1.DTOs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceWithTeamDTO {
    private ResourceMapDTO resource;
    private List<UserTeamDTO> team;
}
