package com.example.emergency_project1.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
//יצירת תקית data
@Component
@Order(0)
public class DatabaseDirectoryInitializer implements ApplicationRunner {

    @Override
    public void run(ApplicationArguments args) throws Exception {
        Path dataDir = Path.of(System.getProperty("user.dir"), "data").toAbsolutePath();
        Files.createDirectories(dataDir);
    }
}
