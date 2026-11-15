package com.example.emergency_project1.entities;

public enum Role {
    // ניהול ומערכת
    ADMIN,
    DISPATCHER,        // מוקדן / מפעיל חמ"ל

    // רפואה וחירום
    MEDIC,             // חובש
    PARAMEDIC,         // פראמדיק
    DOCTOR,            // רופא בשטח/צבאי
    FIRST_RESPONDER,   // מגיש עזרה ראשונה / כונן

    // משטרה וביטחון פנים
    POLICEMAN,
    DETECTIVE,         // בלש / חוקר
    SECURITY_GUARD,    // מאבטח

    // כבאות והצלה
    FIREFIGHTER,       // לוחם אש / כבאי
    RESCUE_WORKER,     // מחלץ (יחידות חילוץ)

    // צבא וביטחון
    SOLDIER,           // חייל
    MILITARY_OFFICER,  // קצין
    COMMANDER          // מפקד אירוע / מפקד שטח
}

