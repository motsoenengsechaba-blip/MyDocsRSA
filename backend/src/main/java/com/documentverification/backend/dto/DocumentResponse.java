package com.documentverification.backend.dto;

import java.time.LocalDateTime;

import com.documentverification.backend.entity.Document;

/**


 * Creates the DocumentResponse object used by the MyDocs RSA backend.


 */


/**
 * Represents the safe document information returned to the MyDocs RSA client without exposing internal storage details.
 */
public record DocumentResponse(
        Long documentId,
        Long userId,
        String documentName,
        String documentType,
        String status,
        String originalFileName,
        LocalDateTime uploadedAt,
        LocalDateTime updatedAt,
        String rejectionReason) {

    /**


     * Handles the from operation used by the MyDocs RSA backend.


     */


    public static DocumentResponse from(Document d) {
        return new DocumentResponse(
                d.getId(),
                d.getUser().getId(),
                d.getDocumentName(),
                d.getDocumentType().name(),
                d.getStatus().name(),
                d.getOriginalFileName(),
                d.getUploadedAt(),
                d.getUpdatedAt(),
                d.getRejectionReason());
    }
}
