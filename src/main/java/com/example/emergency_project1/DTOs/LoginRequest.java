package com.example.emergency_project1.DTOs;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class LoginRequest {

    private Object tz;
    private String password;

    public Object getTz() {
        return tz;
    }

    public void setTz(Object tz) {
        this.tz = tz;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public long tzAsLong() {
        if (tz == null) {
            throw new IllegalArgumentException("tz is required");
        }
        if (tz instanceof Number) {
            Number number = (Number) tz;
            long value = number.longValue();
            int len = String.valueOf(value).length();
            if (len != 8 && len != 9) {
                throw new IllegalArgumentException("תעודת זהות חייבת להכיל 8 או 9 ספרות");
            }
            return value;
        }
        String tzText = tz.toString().trim();
        if (tzText.isEmpty()) {
            throw new IllegalArgumentException("tz is required");
        }
        if (!tzText.matches("^\\d{8,9}$")) {
            throw new IllegalArgumentException("תעודת זהות חייבת להכיל 8 או 9 ספרות");
        }
        return Long.parseLong(tzText);
    }
}