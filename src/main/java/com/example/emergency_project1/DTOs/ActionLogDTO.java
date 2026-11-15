package com.example.emergency_project1.DTOs;

import com.example.emergency_project1.entities.ActionLog;
import com.example.emergency_project1.entities.OrganizationType;
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
public class ActionLogDTO {
    private Long id;
    private Long incidentId;
    private Long senderTz;
    private String senderName;
    private String messageContent;
    private OrganizationType targetOrganization;
    private boolean requiresAction;
    private LocalDateTime timestamp;

    public static ActionLogDTO from(ActionLog log) {
        return ActionLogDTO.builder()
                .id(log.getId())
                .incidentId(log.getIncident() != null ? log.getIncident().getId() : null)
                .senderTz(log.getSender() != null ? log.getSender().getTz() : null)
                .senderName(log.getSender() != null ? log.getSender().getName() : null)
                .messageContent(log.getMessageContent())
                .targetOrganization(log.getTargetOrganization())
                .requiresAction(log.isRequiresAction())
                .timestamp(log.getTimestamp())
                .build();
    }
}
