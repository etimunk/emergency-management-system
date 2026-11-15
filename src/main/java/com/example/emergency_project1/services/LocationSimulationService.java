package com.example.emergency_project1.services;

import com.example.emergency_project1.entities.Resource;
import com.example.emergency_project1.entities.ResourceStatus;
import com.example.emergency_project1.repositories.ResourceRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LocationSimulationService {

    // מרכז גוש דן (תל אביב) + רדיוס 20 ק"מ
    private static final double CENTER_LAT = 32.0853;
    private static final double CENTER_LON = 34.7818;
    private static final double MAX_RADIUS_KM = 20.0;

    // קו החוף המערבי של תל אביב — לא לתת למשאבים להיכנס לים
    private static final double COASTLINE_LON = 34.78;

    @Autowired
    private ResourceRep resourceRep;
    @Scheduled(fixedRate = 5000)
    @Transactional
    public void simulateMovement() {
        List<Resource> enRouteResources =
                resourceRep.findByStatusWithIncident(ResourceStatus.EN_ROUTE);
        for (Resource r : enRouteResources) {
            moveOnRoute(r);
        }
        if (!enRouteResources.isEmpty()) {
            resourceRep.saveAll(enRouteResources);
        }

        List<Resource> availableResources = resourceRep.findByStatus(ResourceStatus.AVAILABLE);
        for (Resource r : availableResources) {
            moveRandomly(r);
        }
        if (!availableResources.isEmpty()) {
            resourceRep.saveAll(availableResources);
        }
    }
    private void moveRandomly(Resource resource) {
        double MIN_LAT = 31.95;
        double MAX_LAT = 32.15;

        double deltaTime = 5.0 / 3600.0; // תואם ל-fixedRate (5 שניות)

        // שינוי קטן במהירות
        double speed = resource.getSpeed() + (Math.random() - 0.5) * 5;
        speed = Math.max(0, Math.min(speed, 80)); // לא מהר מדי בעיר

        // שינוי קטן בכיוון
        double heading = resource.getHeading() + (Math.random() - 0.5) * 20;
        heading = (heading + 360) % 360;

        // חישוב תזוזה
        double distance = speed * deltaTime;
        double headingRad = Math.toRadians(heading);

        double lat = resource.getLatitude();
        double lon = resource.getLongitude();

        double factor = 0.02; // מקדם תנועה — נראה לעין על המפה

        double newLat = lat + factor * distance * Math.cos(headingRad);
        double newLon = lon + factor * distance * Math.sin(headingRad);

        // מניעת כניסה לים — היפוך כיוון אם חוצים את קו החוף
        if (newLon < COASTLINE_LON) {
            heading = (heading + 180) % 360;
            newLon = COASTLINE_LON + 0.001; // קצת מזרחית לחוף
        }

        if (resource.getLatitude() > MAX_LAT || resource.getLatitude() < MIN_LAT) {
            heading = (heading + 180) % 360;
        }

        resource.setLatitude(newLat);
        resource.setLongitude(newLon);
        resource.setSpeed(speed);
        resource.setHeading(heading);

        // אכיפת גבולות גוש דן
        enforceGushDanBounds(resource);
    }

    private void enforceGushDanBounds(Resource resource) {
        double dist = calculateDistanceKm(CENTER_LAT, CENTER_LON, resource.getLatitude(), resource.getLongitude());
        if (dist > MAX_RADIUS_KM) {
            // החזר למרכז + היפוך כיוון
            resource.setLatitude(CENTER_LAT);
            resource.setLongitude(CENTER_LON);
            resource.setHeading((resource.getHeading() + 180) % 360);
        }
    }

    private double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // כדור הארץ בק"מ
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private void moveOnRoute(Resource resource) {
        // 1. בדיקה שיש לאן לנסוע
        if (resource.getCurrentIncident() == null) {
            return;
        }

        double targetLat = resource.getCurrentIncident().getLatitude();
        double targetLon = resource.getCurrentIncident().getLongitude();
        double currLat = resource.getLatitude();
        double currLon = resource.getLongitude();

        // 2. חישוב ווקטור הכיוון ליעד
        double deltaLat = targetLat - currLat;
        double deltaLon = targetLon - currLon;

        // מרחק אווקלידי פשוט לצורך הסימולציה
        double distanceToTarget = Math.sqrt(deltaLat * deltaLat + deltaLon * deltaLon);

        // 3. הגדרת מהירות קבועה וגבוהה יותר בחירום
        double speed = 90.0; // קמ"ש
        double deltaTime = 5.0 / 3600.0; // 5 שניות (לפי ה-fixedRate שלך)
        double stepSize = (speed * deltaTime) * 0.02;

        // 4. בדיקה אם הגענו ליעד (כדי למנוע "דילוג" מעליו)
        if (distanceToTarget <= stepSize) {
            resource.setLatitude(targetLat);
            resource.setLongitude(targetLon);
            resource.setSpeed(0);
            resource.setStatus(ResourceStatus.BUSY); // הגיע ליעד — מתחיל טיפול
            return;
        }

        // 5. חישוב המיקום החדש - התקדמות בקו ישר לעבר היעד
        double ratio = stepSize / distanceToTarget;
        double newLat = currLat + (deltaLat * ratio);
        double newLon = currLon + (deltaLon * ratio);

        // 6. עדכון המשאב
        resource.setLatitude(newLat);
        resource.setLongitude(newLon);
        resource.setSpeed(speed);

        // עדכון ה-Heading (אופציונלי - לצורך תצוגה במפה)
        double angle = Math.toDegrees(Math.atan2(deltaLon, deltaLat));
        resource.setHeading((angle + 360) % 360);

        // מניעת כניסה לים
        if (resource.getLongitude() < COASTLINE_LON) {
            resource.setLongitude(COASTLINE_LON + 0.001);
            resource.setHeading((resource.getHeading() + 180) % 360);
        }

        // אכיפת גבולות גוש דן
        enforceGushDanBounds(resource);
    }
}
