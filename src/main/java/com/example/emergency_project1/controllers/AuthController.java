package com.example.emergency_project1.controllers;

import com.example.emergency_project1.DTOs.LoginRequest;
import com.example.emergency_project1.DTOs.RegisterRequest;
import com.example.emergency_project1.entities.User;
import com.example.emergency_project1.security.JwtUtils;
import com.example.emergency_project1.services.UserServ;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserServ userService;

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        log.info("Health check called");
        return ResponseEntity.ok(Map.of("status", "auth-ok"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest body) {
        log.info("Login attempt for tz: {}", body != null ? body.getTz() : "null");
        try {
            if (body == null) {
                return ResponseEntity.badRequest().body("בקשה ריקה");
            }
            long tz = body.tzAsLong();
            String password = body.getPassword();
            User user = userService.login(tz, password);
            boolean hasResource = userService.hasResource(tz);
            String token = jwtUtils.generateToken(user, hasResource);
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("role", user.getRole() != null ? user.getRole().name() : "UNKNOWN");
            response.put("orgType", user.getOrgType() != null ? user.getOrgType().name() : "UNKNOWN");
            response.put("userName", user.getName());
            log.info("Login successful for tz: {}", tz);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Login bad request: {}", e.getMessage());
            return ResponseEntity.badRequest().body("תעודת זהות לא תקינה");
        } catch (RuntimeException e) {
            log.warn("Login failed for tz={}: {}", body != null ? body.getTz() : null, e.getMessage());
            return ResponseEntity.status(401).body("פרטי התחברות שגויים");
        } catch (Exception e) {
            log.error("Login error", e);
            return ResponseEntity.status(500).body("שגיאת שרת בהתחברות");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest body) {
        log.info("Registration attempt for tz: {}", body.getTz());
        try {
            User user = User.builder()
                    .tz(body.getTz())
                    .name(body.getName())
                    .role(body.getRole())
                    .orgType(body.getOrgType())
                    .password(body.getPassword())
                    .build();

            User savedUser = userService.addUser(user);
            log.info("Registration successful for tz: {}", savedUser.getTz());
            return ResponseEntity.ok(Map.of("message", "User registered successfully", "tz", savedUser.getTz()));
        } catch (Exception e) {
            log.error("Registration error", e);
            return ResponseEntity.status(500).body("שגיאת שרת בהרשמה: " + e.getMessage());
        }
    }
}
