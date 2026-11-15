package com.example.emergency_project1.config;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class WebSocketController {

    /**
     * מקבל הודעה מה-Client או מה-Agent ושולח אותה לכל המנויים.
     * הנתיב לשליחה: /app/message
     * הנתיב להאזנה: /topic/updates
     */
    @MessageMapping("/message")
    @SendTo("/topic/updates")
    public Map<String, Object> handleMessage(Map<String, Object> message) {
        return message;
    }
}