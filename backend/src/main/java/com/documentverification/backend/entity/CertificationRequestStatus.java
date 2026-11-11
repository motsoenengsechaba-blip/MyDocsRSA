package com.documentverification.backend.entity;

/**
 * Represents the stages of a MyDocs RSA certification request from submission through final decision.
 */
public enum CertificationRequestStatus {
    SUBMITTED,
    UNDER_REVIEW,
    INVESTIGATION_REQUIRED,
    APPROVED,
    REJECTED,
    RESUBMISSION_REQUIRED
}
