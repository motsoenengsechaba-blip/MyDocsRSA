package com.documentverification.backend.dto;

import java.time.LocalDateTime;

import com.documentverification.backend.entity.DigitalCredential;

/**


 * Creates the CredentialResponse object used by the MyDocs RSA backend.


 */


/**
 * Represents the digital credential information returned to the MyDocs RSA client for the user's wallet or verification screen.
 */
public record CredentialResponse(
        Long credentialId,
        Long documentId,
        String documentType,
        String otherDescription,
        String status,
        String verificationCode,
        LocalDateTime issuedAt,
        LocalDateTime validUntil) {
    /**

     * Handles the from operation used by the MyDocs RSA backend.

     */

    public static CredentialResponse from(DigitalCredential c) {
        String status = c.getStatus().name();
        if (c.getValidUntil() != null && c.getValidUntil().isBefore(LocalDateTime.now()) && "ACTIVE".equals(status)) {
            status = "EXPIRED";
        }
        return new CredentialResponse(c.getId(), c.getDocument().getId(), c.getDocument().getDocumentType().name(), c.getDocument().getOtherDescription(),
                status, c.getVerificationCode(), c.getIssuedAt(), c.getValidUntil());
    }
}
