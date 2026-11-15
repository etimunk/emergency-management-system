package com.example.emergency_project1.controllers;

import com.example.emergency_project1.DTOs.OperatorProfileDTO;
import com.example.emergency_project1.entities.OrganizationType;
import com.example.emergency_project1.entities.Resource;
import com.example.emergency_project1.entities.User;
import com.example.emergency_project1.services.UserServ;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users") // בחרתי בנתיב המאובטח יותר, ניתן לשנות ל- "/users" במידת הצורך
@CrossOrigin(origins = "*")
public class UserCon {

    @Autowired
    private UserServ userService;

    // --- שליפת נתונים (GET) ---

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{tz}/operator-profile")
    public OperatorProfileDTO getOperatorProfile(@PathVariable long tz) {
        return userService.getOperatorProfile(tz);
    }

    @GetMapping("/org/{orgType}")
    public List<User> getByOrgType(@PathVariable OrganizationType orgType) {
        return userService.getUsersByOrgType(orgType);
    }

    @GetMapping("/search")
    public List<User> searchByName(@RequestParam String name) {
        return userService.searchByName(name);
    }

    @GetMapping("/exists/{tz}")
    public boolean exists(@PathVariable long tz) {
        return userService.userExists(tz);
    }

    @GetMapping("/no-resource")
    public List<User> usersWithoutResource() {
        return userService.getUsersWithoutResource();
    }

    @GetMapping("/eligible-owners")
    public List<User> eligibleOwners(@RequestParam(required = false) OrganizationType orgType) {
        return userService.getEligibleOwners(orgType);
    }

    @GetMapping("/is-owner/{tz}")
    public boolean isOwner(@PathVariable long tz) {
        return userService.isResourceOwner(tz);
    }

    /** חייב להיות אחרון — אחרת נתיבים כמו eligible-team-members נתפסים כ-tz */
    @GetMapping("/{tz}")
    public User getUserByTz(@PathVariable long tz) {
        return userService.getUserByTz(tz);
    }

    // --- יצירה והתחברות (POST) ---

    @PostMapping
    public User addUser(@RequestBody User user) {
        return userService.addUser(user);
    }

    @PostMapping("/login")
    public User login(@RequestParam long tz, @RequestParam String password) {
        return userService.login(tz, password);
    }

    @PostMapping("/assign/{tz}")
    public User assignResource(@PathVariable long tz, @RequestBody Resource resource) {
        return userService.assignResource(tz, resource);
    }

    // --- עדכון (PUT) ---

    @PutMapping("/{tz}")
    public User updateUser(@PathVariable long tz, @RequestBody User user) {
        return userService.updateUser(tz, user);
    }

    @PutMapping("/change-password/{tz}")
    public void changePassword(@PathVariable long tz,
                               @RequestParam String oldPass,
                               @RequestParam String newPass) {
        userService.changePassword(tz, oldPass, newPass);
    }

    // --- מחיקה (DELETE) ---

    @DeleteMapping("/{tz}")
    public void deleteUser(@PathVariable long tz) {
        userService.deleteUser(tz);
    }
}