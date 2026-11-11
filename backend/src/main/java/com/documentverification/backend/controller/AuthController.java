package com.documentverification.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.documentverification.backend.dto.LoginRequest;
import com.documentverification.backend.dto.RegisterRequest;
import com.documentverification.backend.dto.UpdateAccountRequest;
import com.documentverification.backend.entity.User;
import com.documentverification.backend.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    /**

     * Performs the operation represented by this method.

     */

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    /**

     * Registers a new MyDocs RSA user, returns the new user details and JWT, and triggers the welcome-email workflow.

     */

    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = authService.register(request);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "Registration successful",
                            "userId", user.getId(),
                            "fullName", user.getFullName(),
                            "email", user.getEmail(),
                            "role", user.getRole().name(),
                            "token", authService.createToken(user)
                    ));

        } catch (RuntimeException e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message", e.getMessage()
                    ));
        }
    } // <-- Added missing closing brace for the register method

    @GetMapping("/me")
    /**

     * Returns the account details belonging to the user identified by the JWT used for this request.

     */

    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        try {
            User user = authService.getCurrentUser(authentication.getName());

            return ResponseEntity.ok(Map.of(
                    "userId", user.getId(),
                    "fullName", user.getFullName(),
                    "email", user.getEmail(),
                    "phoneNumber", user.getPhoneNumber() == null ? "" : user.getPhoneNumber(),
                    "role", user.getRole().name(),
                    "active", user.getActive()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/me")
    /**

     * Updates the logged-in MyDocs RSA user's profile details, including name, phone number and optional password.

     */

    public ResponseEntity<?> updateCurrentUser(
            @Valid @RequestBody UpdateAccountRequest request,
            Authentication authentication) {

        try {
            User user = authService.updateCurrentUser(
                    authentication.getName(),
                    request.getFullName(),
                    request.getPhoneNumber(),
                    request.getPassword()
            );

            return ResponseEntity.ok(Map.of(
                    "message", "Account updated successfully",
                    "userId", user.getId(),
                    "fullName", user.getFullName(),
                    "email", user.getEmail(),
                    "phoneNumber", user.getPhoneNumber() == null ? "" : user.getPhoneNumber(),
                    "role", user.getRole().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/me")
    /**

     * Permanently deletes the logged-in user account and its related MyDocs RSA data after the account-deletion checks are performed.

     */

    public ResponseEntity<?> deleteCurrentUser(Authentication authentication) {
        try {
            authService.deleteCurrentUser(authentication.getName());

            return ResponseEntity.ok(
                    Map.of("message", "Account deleted successfully")
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    /**

     * Checks the supplied MyDocs RSA email and password and returns a JWT when the account is valid and active.

     */

    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            User user = authService.login(
                    request.getEmail(),
                    request.getPassword()
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message", "Login successful",
                            "userId", user.getId(),
                            "fullName", user.getFullName(),
                            "email", user.getEmail(),
                            "role", user.getRole().name(),
                            "token", authService.createToken(user)
                    )
            );

        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message", e.getMessage()
                    ));
        }
    }
}  

