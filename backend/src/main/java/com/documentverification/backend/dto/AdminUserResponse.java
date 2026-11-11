package com.documentverification.backend.dto;

import java.time.LocalDateTime;

import com.documentverification.backend.entity.User;

/**
 * One account as shown to an admin. The password hash is never included.
 * requestCount = certification requests the person submitted.
 * reviewedCount = requests an officer has decided (approved, rejected or sent back).
 */
public record AdminUserResponse(
        Long id,
        String fullName,
        String email,
        String phoneNumber,
        String role,
        boolean active,
        LocalDateTime createdAt,
        long requestCount,
        long reviewedCount) {

    public static AdminUserResponse from(User u, long requestCount, long reviewedCount) {
        return new AdminUserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getPhoneNumber(),
                u.getRole().name(), u.isActive(), u.getCreatedAt(), requestCount, reviewedCount);
    }
}
