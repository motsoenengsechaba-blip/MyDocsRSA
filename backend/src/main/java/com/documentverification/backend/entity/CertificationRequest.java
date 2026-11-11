package com.documentverification.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "certification_requests")
/**
 * Represents a user request to have a document digitally certified through the MyDocs RSA verification workflow.
 */
public class CertificationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "has_certified_copy", nullable = false)
    private boolean hasCertifiedCopy;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_path", nullable = false)
    private ProcessingPath processingPath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CertificationRequestStatus status;

    @Column(length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Audit trail: the officer who picked up / decided this request. Stored as plain values
    // (no foreign key) so the history stays intact even if that officer's account is deleted.
    @Column(name = "reviewed_by_id")
    private Long reviewedById;

    @Column(name = "reviewed_by_name", length = 150)
    private String reviewedByName;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    /**

     * Performs the operation represented by this method.

     */

    public CertificationRequest() {}

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) status = CertificationRequestStatus.SUBMITTED;
    }

    /**


     * Returns the database ID. 


     */


    public Long getId() { return id; }
    /**

     * Returns the MyDocs RSA user who owns the record. 

     */

    public User getUser() { return user; }
    /**

     * Sets the MyDocs RSA user who owns the record on this object.

     */

    public void setUser(User user) { this.user = user; }
    /**

     * Returns the document linked to this record. 

     */

    public Document getDocument() { return document; }
    /**

     * Sets the document linked to this record on this object.

     */

    public void setDocument(Document document) { this.document = document; }
    /**

     * Returns whether whether the user supplied an existing police-certified copy is true.

     */

    public boolean isHasCertifiedCopy() { return hasCertifiedCopy; }
    /**

     * Sets whether the user supplied an existing police-certified copy on this object.

     */

    public void setHasCertifiedCopy(boolean hasCertifiedCopy) { this.hasCertifiedCopy = hasCertifiedCopy; }
    /**

     * Returns whether the request follows the fast certified-copy route or investigation route. 

     */

    public ProcessingPath getProcessingPath() { return processingPath; }
    /**

     * Sets whether the request follows the fast certified-copy route or investigation route on this object.

     */

    public void setProcessingPath(ProcessingPath processingPath) { this.processingPath = processingPath; }
    /**

     * Returns the current verification or credential status. 

     */

    public CertificationRequestStatus getStatus() { return status; }
    /**

     * Sets the current verification or credential status on this object.

     */

    public void setStatus(CertificationRequestStatus status) { this.status = status; }
    /**

     * Returns additional notes recorded during certification processing. 

     */

    public String getNotes() { return notes; }
    /**

     * Sets additional notes recorded during certification processing on this object.

     */

    public void setNotes(String notes) { this.notes = notes; }
    /**

     * Returns the date and time the account was created. 

     */

    public LocalDateTime getCreatedAt() { return createdAt; }
    /**

     * Returns the time the document record was last changed. 

     */

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    /**

     * Handles the touch operation used by the MyDocs RSA backend.

     */

    public void touch() { updatedAt = LocalDateTime.now(); }

    public Long getReviewedById() { return reviewedById; }
    public void setReviewedById(Long reviewedById) { this.reviewedById = reviewedById; }

    public String getReviewedByName() { return reviewedByName; }
    public void setReviewedByName(String reviewedByName) { this.reviewedByName = reviewedByName; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
