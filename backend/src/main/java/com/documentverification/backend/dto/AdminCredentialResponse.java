package com.documentverification.backend.dto;

import java.time.LocalDateTime;

import com.documentverification.backend.entity.DigitalCredential;

/**
 * One digital credential as shown to an admin, including who holds it.
 */
public record AdminCredentialResponse(
        Long credentialId,
        String holderName,
        String holderEmail,
        String documentType,
        String otherDescription,
        String status,
        String verificationCode,
        LocalDateTime issuedAt,
        LocalDateTime validUntil,
        LocalDateTime revokedAt,
        String revocationReason) {

    /** ACTIVE credentials past their end date count as EXPIRED (same rule as the user's wallet). */
    public static String effectiveStatus(DigitalCredential c) {
        String status = c.getStatus().name();
        if ("ACTIVE".equals(status) && c.getValidUntil() != null
                && c.getValidUntil().isBefore(LocalDateTime.now())) {
            return "EXPIRED";
        }
        return status;
    }

    public static AdminCredentialResponse from(DigitalCredential c) {
        return new AdminCredentialResponse(c.getId(), c.getUser().getFullName(), c.getUser().getEmail(),
                c.getDocument().getDocumentType().name(), c.getDocument().getOtherDescription(), effectiveStatus(c), c.getVerificationCode(),
                c.getIssuedAt(), c.getValidUntil(), c.getRevokedAt(), c.getRevocationReason());
    }
}
