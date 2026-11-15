package com.example.emergency_project1.config;

import com.example.emergency_project1.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * Interceptor שמאמת JWT על חיבור WebSocket.
 * 
 * - אם מגיע טוקן (מה-React) → חייב להיות תקין
 * - אם לא מגיע טוקן (מה-Python Agent) → מתיר את החיבור
 */
@Component
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) throws Exception {

        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            String token = servletRequest.getServletRequest().getParameter("token");

            // אם אין טוקן — מתירים (ל-Agent)
            if (token == null || token.isBlank()) {
                return true;
            }

            // אם יש טוקן — חייב להיות תקין (ל-React Client)
            try {
                String username = jwtUtils.extractUsername(token);
                if (username != null && !jwtUtils.isTokenExpired(token)) {
                    attributes.put("userTz", username);
                    return true;
                }
            } catch (Exception e) {
                // טוקן לא תקין
                return false;
            }
        }

        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
                               ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Exception exception) {
        // אין צורך בלוגיקה אחרי ה-handshake
    }
}