package com.example.emergency_project1.services;
import com.example.emergency_project1.DTOs.ActionLogDTO;
import com.example.emergency_project1.entities.ActionLog;
import com.example.emergency_project1.entities.Incident;
import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.Resource;
import com.example.emergency_project1.entities.User;
import com.example.emergency_project1.repositories.ActionLogRep;
import com.example.emergency_project1.repositories.IncidentRep;
import com.example.emergency_project1.repositories.UserRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ActionLogServ {

    @Autowired
    private ActionLogRep actionLogRep;

    @Autowired
    private UserRep userRep;

    @Autowired
    private IncidentRep incidentRep;

    @Autowired
    private IncidentServ incidentServ;

    // הוספה
    @Transactional
    public ActionLog createActionLog(ActionLog actionLog) {
        if (actionLog.getSender() == null || actionLog.getIncident() == null) {
            throw new RuntimeException("Sender and Incident must be provided");
        }

        User sender = userRep.findById(actionLog.getSender().getTz())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Incident incident = incidentRep.findById(actionLog.getIncident().getId())
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        // בדיקה שהמשתמש שייך לאירוע (מנהל מערכת יכול לדלג על זה, אבל זה לדיווחים מהשטח)
        Resource assignedResource = sender.getResource();
        if (assignedResource == null) {
            // בדיקה אם המשתמש הוא מנהל משאב (Owner) שלא שויך כ-member
            assignedResource = sender.getOwnedResource();
        }

        if (assignedResource == null || assignedResource.getCurrentIncident() == null || 
            !assignedResource.getCurrentIncident().getId().equals(incident.getId())) {
            throw new RuntimeException("משתמש זה אינו משויך לאירוע הפעיל ולכן לא יכול לדווח מהשטח.");
        }

        actionLog.setSender(sender);
        actionLog.setIncident(incident);
        actionLog.setTimestamp(LocalDateTime.now());
        
        ActionLog savedLog = actionLogRep.save(actionLog);

        // טריגר לסוכן (הפעלת הסוכן ברקע על מנת לקבל את הדיווח באופן מידי)
        new Thread(() -> {
            incidentServ.triggerAgent(incident.getId(), "NEW_REPORT");
        }).start();

        return savedLog;
    }

    // קבלת כל הרשומות
    public List<ActionLog> getAllActionLogs() {
        return actionLogRep.findAll();
    }

    // קבלת רשומה לפי ID
    public Optional<ActionLog> getActionLogById(Long id) {
        return actionLogRep.findById(id);
    }

    // עדכון רשומה קיימת
    public ActionLog updateActionLog(Long id, ActionLog actionLogDetails) {
        ActionLog actionLog = actionLogRep.findById(id)
                .orElseThrow(() -> new RuntimeException("ActionLog not found with id: " + id));

        actionLog.setMessageContent(actionLogDetails.getMessageContent());
        actionLog.setRequiresAction(actionLogDetails.isRequiresAction());
        // כאן מעדכנים עוד שדות לפי הצורך

        return actionLogRep.save(actionLog);
    }
    // מחיקה
    public void deleteActionLog(Long id) {
        actionLogRep.deleteById(id);
    }
    public List<ActionLog> getActionLogByTargetOrganization(OrganizationType targetOrganization){
        return  actionLogRep.findByTargetOrganization(targetOrganization);
    }
    public List<ActionLog> getActionLogByTimestamp(LocalDateTime timestamp){
        return  actionLogRep.findByTimestamp(timestamp);
    }
    public List<ActionLog> getActionLogByIncident(long incidentId){
        return  actionLogRep.findByIncident_IdOrderByTimestampDesc(incidentId);
    }

    @Transactional(readOnly = true)
    public List<ActionLogDTO> getActionLogDtosByIncident(long incidentId) {
        return getActionLogByIncident(incidentId).stream()
                .map(ActionLogDTO::from)
                .toList();
    }
    public List<ActionLog> getActionLogsByUser(Long userTZ) {
        return actionLogRep.findBySenderTz(userTZ);
    }

    // קבלת הודעות על טווח זמן מסוים
    public List<ActionLog> getActionLogsByTimeRange(LocalDateTime start, LocalDateTime end) {
        return actionLogRep.findByTimestampBetween(start, end);
    }
}