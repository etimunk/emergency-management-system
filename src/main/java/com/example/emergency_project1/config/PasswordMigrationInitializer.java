package com.example.emergency_project1.config;

import com.example.emergency_project1.entities.User;
import com.example.emergency_project1.repositories.UserRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * מיגרציה חד-פעמית (רצה בכל startup, idempotent):
 * כל משתמש whose password is stored as plain text gets re-encoded to bcrypt.
 * משתמשים עם bcrypt תקין — לא נוגעים.
 */
@Component
@Order(10)
public class PasswordMigrationInitializer implements CommandLineRunner {

    private static final String DEFAULT_FIELD_PASSWORD = "user1234";
    private static final String DEFAULT_ADMIN_PASSWORD = "admin1234";

    @Autowired
    private UserRep userRep;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        int encodedLegacy = 0;
        int filledEmpty = 0;

        for (User user : userRep.findAll()) {
            String stored = user.getPassword();
            if (stored == null || stored.isBlank()) {
                String defaultPassword = user.getRole() == com.example.emergency_project1.entities.Role.ADMIN
                        ? DEFAULT_ADMIN_PASSWORD
                        : DEFAULT_FIELD_PASSWORD;
                user.setPassword(passwordEncoder.encode(defaultPassword));
                userRep.save(user);
                filledEmpty++;
                continue;
            }
            if (isBcryptHash(stored)) {
                continue;
            }
            user.setPassword(passwordEncoder.encode(stored.trim()));
            userRep.save(user);
            encodedLegacy++;
        }

        System.out.println("Password migration: re-encoded " + encodedLegacy
                + " legacy plain-text password(s), filled " + filledEmpty + " empty password(s)");
        if (filledEmpty > 0) {
            System.out.println("Password migration: users with empty password now use "
                    + DEFAULT_FIELD_PASSWORD + " (field) or " + DEFAULT_ADMIN_PASSWORD + " (admin)");
        }
    }

    private static boolean isBcryptHash(String password) {
        return password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$");
    }
}
