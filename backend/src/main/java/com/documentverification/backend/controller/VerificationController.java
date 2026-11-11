package com.documentverification.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.documentverification.backend.dto.ReviewRequest;
import com.documentverification.backend.entity.Document;
import com.documentverification.backend.dto.DocumentResponse;
import com.documentverification.backend.service.VerificationService;

@RestController
@RequestMapping("/api/verification")
public class VerificationController {

    private final VerificationService verificationService;

    /**

     * Performs the operation represented by this method.

     */

    public VerificationController(
            VerificationService verificationService) {

        this.verificationService = verificationService;
    }

    // ============================================================
    // GET PENDING DOCUMENTS
    // ============================================================

    @GetMapping("/pending")
    /**

     * Returns documents currently waiting for a police officer to review.

     */

    public ResponseEntity<?> getPendingDocuments() {

        try {

            List<Document> documents =
                    verificationService.getPendingDocuments();

            return ResponseEntity.ok(documents.stream().map(DocumentResponse::from).toList());

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));
        }
    }

    // ============================================================
    // START REVIEW
    // ============================================================

    @PutMapping("/{documentId}/review")
    /**

     * Marks a pending document as under review when a police officer begins checking its authenticity.

     */

    public ResponseEntity<?> startReview(
            @PathVariable Long documentId) {

        try {

            Document document =
                    verificationService.startReview(documentId);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Document is now under review",
                            "documentId",
                            document.getId(),
                            "status",
                            document.getStatus().name()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));
        }
    }

    // ============================================================
    // APPROVE DOCUMENT
    // ============================================================

    @PutMapping("/{documentId}/approve")
    /**

     * Approves a document after police verification and triggers creation of the associated digital credential and notification.

     */

    public ResponseEntity<?> approveDocument(
            @PathVariable Long documentId) {

        try {

            Document document =
                    verificationService.approveDocument(documentId);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Document approved successfully",
                            "documentId",
                            document.getId(),
                            "status",
                            document.getStatus().name()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));
        }
    }

    // ============================================================
    // REJECT DOCUMENT
    // ============================================================

    @PutMapping("/{documentId}/reject")
    /**

     * Rejects a document and stores the officer's reason so the user can see why verification failed.

     */

    public ResponseEntity<?> rejectDocument(
            @PathVariable Long documentId,
            @Valid @RequestBody ReviewRequest request) {

        try {

            Document document =
                    verificationService.rejectDocument(
                            documentId,
                            request.getReason()
                    );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Document rejected",
                            "documentId",
                            document.getId(),
                            "status",
                            document.getStatus().name(),
                            "reason",
                            document.getRejectionReason()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));
        }
    }

    // ============================================================
    // REQUEST RESUBMISSION
    // ============================================================

    @PutMapping("/{documentId}/resubmission")
    /**

     * Requests another copy of the document when the officer needs the user to correct or replace the submission.

     */

    public ResponseEntity<?> requestResubmission(
            @PathVariable Long documentId,
            @Valid @RequestBody ReviewRequest request) {

        try {

            Document document =
                    verificationService.requestResubmission(
                            documentId,
                            request.getReason()
                    );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Document requires resubmission",
                            "documentId",
                            document.getId(),
                            "status",
                            document.getStatus().name(),
                            "reason",
                            document.getRejectionReason()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));
        }
    }
}