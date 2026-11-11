package com.documentverification.backend.entity;

/**
 * Represents the stages a document moves through during police verification.
 */
public enum VerificationStatus {

    PENDING,
    UNDER_REVIEW,
    APPROVED,
    REJECTED,
    RESUBMISSION_REQUIRED
}