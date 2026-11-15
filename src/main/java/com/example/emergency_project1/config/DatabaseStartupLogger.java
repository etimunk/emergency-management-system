package com.example.emergency_project1.config;

import com.example.emergency_project1.repositories.IncidentRep;
import com.example.emergency_project1.repositories.ResourceRep;
import com.example.emergency_project1.repositories.UserRep;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.nio.file.Path;
import java.sql.Connection;

/**
 * מדפיס בבירור איפה ה-DB נשמר — כדי שלא יהיה בלבול בין תיקיות/העתקים של הפרויקט.
 */
@Component
public class DatabaseStartupLogger {

    private static final Logger log = LoggerFactory.getLogger(DatabaseStartupLogger.class);

    @Autowired
    private DataSource dataSource;

    @Autowired
    private IncidentRep incidentRep;

    @Autowired
    private ResourceRep resourceRep;

    @Autowired
    private UserRep userRep;

    @EventListener(ApplicationReadyEvent.class)
    public void logDatabaseInfo() {
        String userDir = System.getProperty("user.dir");
        Path expectedDb = Path.of(userDir, "data", "emergencydb.mv.db").toAbsolutePath();

        try (Connection conn = dataSource.getConnection()) {
            String jdbcUrl = conn.getMetaData().getURL();
            log.info("========== מסד נתונים ==========");
            log.info("Working directory (user.dir): {}", userDir);
            log.info("JDBC URL: {}", jdbcUrl);
            log.info("קובץ DB צפוי (אם file:): {}", expectedDb);
            log.info("רשומות ב-DB: incidents={}, resources={}, users={}",
                    incidentRep.count(), resourceRep.count(), userRep.count());
            log.info("================================");
            System.out.println("DB file: " + expectedDb);
            System.out.println("Records: incidents=" + incidentRep.count()
                    + " resources=" + resourceRep.count()
                    + " users=" + userRep.count());
        } catch (Exception e) {
            log.error("Failed to read database info", e);
        }
    }
}
