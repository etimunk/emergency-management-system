package com.example.emergency_project1;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EmergencyProject1Application {

	public static void main(String[] args) {
		SpringApplication.run(EmergencyProject1Application.class, args);
	}
}
