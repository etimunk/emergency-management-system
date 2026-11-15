package com.example.emergency_project1.config;

import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.Role;
import com.example.emergency_project1.entities.User;
import com.example.emergency_project1.repositories.UserRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements CommandLineRunner {

    @Autowired
    private UserRep userRepository;
    //יצירת מנהל מערכת ראשוני
    @Autowired
    private PasswordEncoder passwordEncoder;
    private long tzAdmin = 123456789L;
    private String passwordAdmin = "admin1234";
    private String nameAdmin = "System Manager";

    @Override
    public void run(String... args) throws Exception {
        User admin;
        if (userRepository.existsByTz(tzAdmin)) {
            admin = userRepository.findByTz(tzAdmin);
        } else {
            admin = new User();
            admin.setTz(tzAdmin);
            admin.setName(nameAdmin);
            admin.setRole(Role.ADMIN);
            admin.setOrgType(OrganizationType.MADA);
        }

        admin.setPassword(passwordEncoder.encode(passwordAdmin));
        userRepository.saveAndFlush(admin);

        if (!passwordEncoder.matches(passwordAdmin, admin.getPassword())) {
            throw new IllegalStateException("Admin password was not stored correctly");
        }
        System.out.println("Admin user ready (tz=" + tzAdmin + ", password=admin1234)");
    }
}