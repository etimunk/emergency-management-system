package com.example.emergency_project1.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private WebSocketHandshakeInterceptor handshakeInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // כל הודעה שמתחילה ב-/topic תופץ לכל המנויים (Pub/Sub)
        config.enableSimpleBroker("/topic");

        // כל הודעה שמתחילה ב-/app תועבר ל-@MessageMapping
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // חיבור רגיל (STOMP) — מתאים ל-Python Agent (stomp.py)
        registry.addEndpoint("/ws-connect")
                .setAllowedOriginPatterns("*")
                .addInterceptors(handshakeInterceptor);

        // חיבור עם SockJS — מתאים ל-React (stompjs + sockjs-client)
        registry.addEndpoint("/ws-connect")
                .setAllowedOriginPatterns("*")
                .addInterceptors(handshakeInterceptor)
                .withSockJS();
    }
}