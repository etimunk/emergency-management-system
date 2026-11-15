package com.example.emergency_project1.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsService userDetailsService;

    /**
     * פונקציה זו מונעת מהפילטר לרוץ על נתיבי התחברות או רישום (Authentication endpoints).
     * זה פותר את בעיית ה-403 Forbidden בגרסאות Spring Boot החדשות עבור נתיבים פתוחים.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        // החרגה של נתיבי התחברות, H2 Console ו-MCP כדי למנוע חסימות
        return path.startsWith("/api/auth") || path.startsWith("/h2-console") || path.startsWith("/api/mcp");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        // חילוץ ה-Token מה-Header
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtils.extractUsername(jwt);
            } catch (Exception e) {
                // ניתן להוסיף כאן לוג של טוקן לא תקין
            }
        }

        // אם יש יוזר ועדיין לא ביצענו אימות ב-SecurityContext
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                if (jwtUtils.validateToken(jwt, userDetails)) {
                    List<GrantedAuthority> authorities = new ArrayList<>(userDetails.getAuthorities());

                    // Extract role and hasResource claims from JWT
                    try {
                        Claims claims = jwtUtils.extractAllClaims(jwt);
                        String role = claims.get("role", String.class);

                        // ADMIN gets ROLE_ADMIN authority
                        if ("ADMIN".equals(role)) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                        }

                        // Resource managers get RESOURCE_MANAGER authority
                        Boolean hasResource = claims.get("hasResource", Boolean.class);
                        if (Boolean.TRUE.equals(hasResource)) {
                            authorities.add(new SimpleGrantedAuthority("RESOURCE_MANAGER"));
                        } else if (!"ADMIN".equals(role)) {
                            // Regular team members (non-admin, no resource)
                            authorities.add(new SimpleGrantedAuthority("TEAM_MEMBER"));
                        }
                    } catch (Exception ignored) {
                        // If claim extraction fails, treat as regular team member
                        authorities.add(new SimpleGrantedAuthority("TEAM_MEMBER"));
                    }

                    UsernamePasswordAuthenticationToken authenticationToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, authorities);
                    authenticationToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            } catch (Exception ignored) {
                // טוקן לא תקין — ממשיכים בלי אימות (הבקשה תיבדק לפי SecurityConfig)
            }
        }

        // המשך לשלב הבא (לפילטר הבא או ל-Controller)
        chain.doFilter(request, response);
    }
}
