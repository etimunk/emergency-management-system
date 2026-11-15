package com.example.emergency_project1.services;

import com.example.emergency_project1.DTOs.OperatorProfileDTO;
import com.example.emergency_project1.DTOs.ResourceMapDTO;
import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.Resource;
import com.example.emergency_project1.entities.Role;
import com.example.emergency_project1.entities.User;
import com.example.emergency_project1.repositories.ResourceRep;
import com.example.emergency_project1.repositories.UserRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserServ implements UserDetailsService {

    @Autowired
    private UserRep userRep;

    @Autowired
    private ResourceRep resourceRep;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // --- מימוש UserDetailsService עבור Spring Security ---

    @Override
    public UserDetails loadUserByUsername(String tzString) throws UsernameNotFoundException {
        try {
            long tz = Long.parseLong(tzString);

            User user = userRep.findByTz(tz);
            if (user == null) {
                throw new UsernameNotFoundException("לא נמצא משתמש עם תעודת זהות: " + tz);
            }

            String authority = user.getOrgType() != null ? user.getOrgType().name() : "USER";
            return org.springframework.security.core.userdetails.User.builder()
                    .username(String.valueOf(user.getTz()))
                    .password(user.getPassword())
                    .roles(authority)
                    .build();
        } catch (NumberFormatException e) {
            throw new UsernameNotFoundException("פורמט תעודת זהות לא תקין בטוקן");
        }
    }

    // --- פונקציות ניהול משתמשים ---

    public List<User> getAllUsers() {
        return userRep.findAll();
    }

    public User getUserByTz(long tz) {
        return userRep.findById(tz)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<User> getUsersByOrgType(OrganizationType orgType) {
        return userRep.findByOrgType(orgType);
    }

    public List<User> getUsersByResource(Resource resource) {
        return userRep.findByResource(resource);
    }

    public User addUser(User user) {
        if (userRep.existsByTz(user.getTz())) {
            throw new RuntimeException("משתמש עם תעודת זהות זו כבר קיים במערכת");
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new RuntimeException("Password is required");
        }
        user.setPassword(encodeIfNeeded(user.getPassword()));
        // מניעת ניסיון לגעת בצד ההפוך של הקשר עם Resource
        user.setOwnedResource(null);
        user.setResource(null);
        return userRep.save(user);
    }

    public User updateUser(long tz, User userDetails) {
        User user = getUserByTz(tz);

        user.setName(userDetails.getName());
        if (userDetails.getRole() != null) {
            user.setRole(userDetails.getRole());
        }
        user.setOrgType(userDetails.getOrgType());
        if (userDetails.getPassword() != null && !userDetails.getPassword().isBlank()) {
            user.setPassword(encodeIfNeeded(userDetails.getPassword()));
        }
        // שיוך משאב מתבצע רק דרך endpoints ייעודיים (assignResource / removeUserFromResource)

        return userRep.save(user);
    }

    @Transactional
    public void deleteUser(long tz) {
        User user = userRep.findById(tz).orElse(null);
        if (user != null) {
            Resource ownedResource = resourceRep.findByResourceOwner(user).orElse(null);
            if (ownedResource != null) {
                ownedResource.setResourceOwner(null);
                ownedResource.setStatus(com.example.emergency_project1.entities.ResourceStatus.UNAVAILABLE);
                resourceRep.save(ownedResource);
            }
            userRep.deleteById(tz);
        }
    }

    // חיפוש לפי שם
    public List<User> searchByName(String name) {
        return userRep.findByNameContainingIgnoreCase(name);
    }

    // בדיקה אם משתמש קיים
    public boolean userExists(long tz) {
        return userRep.existsByTz(tz);
    }

    // לוגיקת התחברות (Login) ידנית
    public User login(long tz, String password) {
        if (password == null || password.isBlank()) {
            throw new RuntimeException("Invalid credentials");
        }

        User user = userRep.findByTz(tz);
        String storedPassword = user != null ? user.getPassword() : null;
        String trimmedPassword = password.trim();

        if (user == null || storedPassword == null) {
            throw new RuntimeException("Invalid credentials");
        }

        if (passwordEncoder.matches(trimmedPassword, storedPassword)) {
            return user;
        }

        // תמיכה בסיסמאות ישנות שנשמרו כטקסט רגיל — מעדכן ל-bcrypt בהתחברות מוצלחת
        if (storedPassword.equals(trimmedPassword)) {
            user.setPassword(passwordEncoder.encode(trimmedPassword));
            userRep.save(user);
            return user;
        }

        throw new RuntimeException("Invalid credentials");
    }

    public boolean hasResource(long tz) {
        User user = userRep.findByTz(tz);
        return user != null && user.getOwnedResource() != null;
    }

    // --- פונקציות ניהול משאבים וסטטיסטיקות ---

    public User assignResource(long tz, Resource resource) {
        User user = getUserByTz(tz);
        user.setResource(resource);
        return userRep.save(user);
    }

    public List<User> getUsersWithoutResource() {
        return userRep.findByResourceIsNull().stream()
                .filter(u -> !isResourceOwner(u.getTz()))
                .toList();
    }

    public List<User> getEligibleOwners(OrganizationType orgType) {
        if (orgType == null) {
            return userRep.findByResourceIsNull().stream()
                    .filter(u -> !isResourceOwner(u.getTz()))
                    .toList();
        }
        return userRep.findEligibleOwnerCandidates(orgType);
    }

    @Transactional(readOnly = true)
    public List<User> getEligibleTeamMembersForManager(long managerTz, OrganizationType orgType, Long resourceId) {
        User manager = getUserByTz(managerTz);
        Resource ownedResource = resourceRep.findByResourceOwner(manager)
                .orElseThrow(() -> new RuntimeException("Only resource managers can request team assignments"));

        if (resourceId != null && !ownedResource.getId().equals(resourceId)) {
            throw new RuntimeException("resourceId does not match manager's resource");
        }

        OrganizationType resourceOrg = ownedResource.getOrgType() != null
                ? ownedResource.getOrgType()
                : manager.getOrgType();
        if (resourceOrg == null) {
            return List.of();
        }
        if (orgType != null && orgType != resourceOrg) {
            throw new RuntimeException("orgType must match the managed resource organization");
        }

        return userRep.findAssignableCandidatesByOrg(resourceOrg, managerTz, Role.PARAMEDIC, com.example.emergency_project1.entities.AssignmentRequestStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public OperatorProfileDTO getOperatorProfile(long tz) {
        User user = getUserByTz(tz);
        Resource ownedResource = resourceRep.findByResourceOwner(user).orElse(null);
        boolean isOwner = ownedResource != null;
        Resource assigned = user.getResource();

        return OperatorProfileDTO.builder()
                .tz(user.getTz())
                .name(user.getName())
                .role(user.getRole())
                .orgType(user.getOrgType())
                .resourceOwner(isOwner)
                .managedResource(isOwner && ownedResource != null ? ResourceMapDTO.from(ownedResource) : null)
                .assignedResource(!isOwner && assigned != null ? ResourceMapDTO.from(assigned) : null)
                .build();
    }

    public boolean isResourceOwner(long tz) {
        User user = getUserByTz(tz);
        return resourceRep.findByResourceOwner(user).isPresent();
    }

    public void changePassword(long tz, String oldPass, String newPass) {
        User user = getUserByTz(tz);
        String stored = user.getPassword();

        boolean oldOk = passwordEncoder.matches(oldPass, stored) || stored.equals(oldPass);
        if (!oldOk) {
            throw new RuntimeException("Wrong password");
        }

        user.setPassword(passwordEncoder.encode(newPass));
        userRep.save(user);
    }

    private String encodeIfNeeded(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            return rawPassword;
        }
        if (rawPassword.startsWith("$2a$") || rawPassword.startsWith("$2b$")) {
            return rawPassword;
        }
        return passwordEncoder.encode(rawPassword);
    }

    public long countByOrgType(OrganizationType orgType) {
        return userRep.countByOrgType(orgType);
    }
}