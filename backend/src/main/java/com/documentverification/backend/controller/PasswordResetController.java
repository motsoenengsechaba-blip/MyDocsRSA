package com.documentverification.backend.controller;

import java.util.Map;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import com.documentverification.backend.service.PasswordResetService;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {
    private final PasswordResetService service;
    public PasswordResetController(PasswordResetService service) { this.service = service; }
    public record Forgot(@NotBlank @Email @Size(max=254) String email) {}
    public record Reset(@NotBlank @Email @Size(max=254) String email, @NotBlank @Pattern(regexp="[0-9]{6}") String code, @NotBlank @Size(max=72) String newPassword) {}
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgot(@Valid @RequestBody Forgot input) {
        try { service.request(input.email()); } catch (RuntimeException ex) {
            Throwable root = ex;
            while (root.getCause() != null && root.getCause() != root) root = root.getCause();
            org.slf4j.LoggerFactory.getLogger(getClass()).warn("Password reset request failed: {} (root cause: {})", ex.getClass().getSimpleName(), root.getClass().getSimpleName());
            return ResponseEntity.status(503).body(Map.of("message", "Password reset is temporarily unavailable. Please try again shortly."));
        }
        return ResponseEntity.ok(Map.of("message", "If this email has an active account, a reset code will be sent. Check your inbox and spam folder."));
    }
    @PostMapping("/reset-password")
    public ResponseEntity<?> reset(@Valid @RequestBody Reset input) {
        try {
            if (!service.reset(input.email(), input.code(), input.newPassword()))
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired code. Request a new code and try again."));
            return ResponseEntity.ok(Map.of("message", "Password changed. You can now sign in."));
        } catch (IllegalArgumentException ex) { return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage())); }
    }
}
