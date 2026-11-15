package com.example.emergency_project1.repositories;

import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.Resource;
import com.example.emergency_project1.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRep extends JpaRepository<User, Long> {

    // מציאת משתמש לפי תעודת זהות
    User findByTz(long tz);

    // בדיקה אם משתמש קיים לפי תעודת זהות
    boolean existsByTz(long tz);

    // חיפוש משתמשים לפי סוג ארגון
    List<User> findByOrgType(OrganizationType orgType);

    // חיפוש משתמשים המשויכים למשאב ספציפי
    List<User> findByResource(Resource resource);

    // חיפוש חופשי בשם (לא רגיש לאותיות גדולות/קטנות)
    List<User> findByNameContainingIgnoreCase(String name);

    // מציאת כל המשתמשים שטרם שויך להם משאב
    List<User> findByResourceIsNull();

    // חיפוש משולב של סוג ארגון ומשאב
    List<User> findByOrgTypeAndResource(OrganizationType orgType, Resource resource);

    // ספירת משתמשים לפי סוג ארגון (לסטטיסטיקות)
    long countByOrgType(OrganizationType orgType);

    /** משתמשים שיכולים להיות מנהלי משאב — לא משויכים ולא מנהלים כבר */
    @Query("SELECT u FROM User u WHERE u.resource IS NULL AND u.orgType = :orgType "
            + "AND NOT EXISTS (SELECT r FROM Resource r WHERE r.resourceOwner = u)")
    List<User> findEligibleOwnerCandidates(@Param("orgType") OrganizationType orgType);

    /** מועמדים לשיוך — אותו ארגון, פרמדיק, לא מנהל משאב, לא המנהל עצמו */
    @Query("SELECT u FROM User u WHERE u.orgType = :orgType "
            + "AND u.role = :role "
            + "AND u.tz <> :managerTz "
            + "AND u.resource IS NULL "
            + "AND NOT EXISTS (SELECT r FROM Resource r WHERE r.resourceOwner = u) "
            + "AND NOT EXISTS (SELECT req FROM ResourceAssignmentRequest req WHERE req.user = u AND req.status = :status)")
    List<User> findAssignableCandidatesByOrg(
            @Param("orgType") OrganizationType orgType,
            @Param("managerTz") long managerTz,
            @Param("role") com.example.emergency_project1.entities.Role role,
            @Param("status") com.example.emergency_project1.entities.AssignmentRequestStatus status);
}