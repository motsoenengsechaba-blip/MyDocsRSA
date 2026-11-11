package com.documentverification.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.documentverification.backend.entity.Role;
import com.documentverification.backend.service.AdminService;

/**
 * Admin dashboard API. Everything under /api/admin is ADMIN-only (also enforced in SecurityConfig).
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats(Authentication authentication) {
        if (!isAdmin(authentication)) return forbidden();
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<?> users(Authentication authentication) {
        if (!isAdmin(authentication)) return forbidden();
        return ResponseEntity.ok(adminService.getUsers());
    }

    @GetMapping("/requests")
    public ResponseEntity<?> requests(Authentication authentication) {
        if (!isAdmin(authentication)) return forbidden();
        return ResponseEntity.ok(adminService.getRequests());
    }

    @GetMapping("/credentials")
    public ResponseEntity<?> credentials(Authentication authentication) {
        if (!isAdmin(authentication)) return forbidden();
        return ResponseEntity.ok(adminService.getCredentials());
    }

    public record RoleRequest(String role) {}

    public record ActiveRequest(Boolean active) {}

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> changeRole(@PathVariable Long id,
                                        @RequestBody RoleRequest body,
                                        Authentication authentication) {
        if (!isAdmin(authentication)) return forbidden();
        if (body == null || body.role() == null || body.role().isBlank()) {
            return badRequest("A role is required");
        }
        Role role;
        try {
            role = Role.valueOf(body.role().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return badRequest("Invalid role");
        }
        try {
            return ResponseEntity.ok(adminService.changeRole(id, role, authentication.getName()));
        } catch (RuntimeException e) {
            return badRequest(e.getMessage());
        }
    }

    @PutMapping("/users/{id}/active")
    public ResponseEntity<?> setActive(@PathVariable Long id,
                                       @RequestBody ActiveRequest body,
                                       Authentication authentication) {
        if (!isAdmin(authentication)) return forbidden();
        if (body == null || body.active() == null) {
            return badRequest("The active flag is required");
        }
        try {
            return ResponseEntity.ok(adminService.setActive(id, body.active(), authentication.getName()));
        } catch (RuntimeException e) {
            return badRequest(e.getMessage());
        }
    }

    private boolean isAdmin(Authentication a) {
        if (a == null || a.getAuthorities() == null) return false;
        return a.getAuthorities().stream().anyMatch(x -> x.getAuthority().equals("ROLE_ADMIN"));
    }

    private ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "You are not allowed to access this endpoint"));
    }

    private ResponseEntity<Map<String, String>> badRequest(String message) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", message == null ? "Request failed" : message));
    }
}
