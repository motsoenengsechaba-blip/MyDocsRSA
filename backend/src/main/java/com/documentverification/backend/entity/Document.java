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
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "documents")
/**
 * Represents a document uploaded to MyDocs RSA for police verification, including its verification state, storage information and resubmission history.
 */
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentType documentType;

    @Column(name = "document_name", nullable = false)
    private String documentName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStatus status;

    @Column(nullable = false)
    private String originalFileName;

    @Column(nullable = false)
    private String storedFileName;

    @Column(nullable = false)
    private String filePath;

    private String rejectionReason;

    @Column(length = 120)
    private String otherDescription;
    public String getOtherDescription() { return otherDescription; }
    public void setOtherDescription(String value) { otherDescription = value; }

    @Column(name = "has_certified_copy", nullable = false)
    private boolean hasCertifiedCopy;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_path")
    private ProcessingPath processingPath;

    @Column(name = "file_fingerprint", length = 64)
    private String fileFingerprint;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    private LocalDateTime updatedAt;



    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_document_id")
    private Document previousDocument;

    /**

     * Performs the operation represented by this method.

     */

    public Document() {
    }

    /**


     * Returns the database ID. 


     */


    public Long getId() {
        return id;
    }

    /**


     * Returns the MyDocs RSA user who owns the record. 


     */


    public User getUser() {
        return user;
    }

    /**


     * Sets the MyDocs RSA user who owns the record on this object.


     */


    public void setUser(User user) {
        this.user = user;
    }

    /**


     * Returns the type of document being verified. 


     */


    public DocumentType getDocumentType() {
        return documentType;
    }

    /**


     * Sets the type of document being verified on this object.


     */


    public void setDocumentType(DocumentType documentType) {
        this.documentType = documentType;
    }

    /**


     * Returns the current verification or credential status. 


     */


    public VerificationStatus getStatus() {
        return status;
    }

    /**


     * Sets the current verification or credential status on this object.


     */


    public void setStatus(VerificationStatus status) {
        this.status = status;
    }

    /**


     * Returns the filename originally supplied by the user. 


     */


    public String getOriginalFileName() {
        return originalFileName;
    }

    /**


     * Sets the filename originally supplied by the user on this object.


     */


    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    /**


     * Returns the safe filename used inside document storage. 


     */


    public String getStoredFileName() {
        return storedFileName;
    }

    /**


     * Sets the safe filename used inside document storage on this object.


     */


    public void setStoredFileName(String storedFileName) {
        this.storedFileName = storedFileName;
    }

    /**


     * Returns the physical storage path of the uploaded file. 


     */


    public String getFilePath() {
        return filePath;
    }

    /**


     * Sets the physical storage path of the uploaded file on this object.


     */


    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    /**


     * Returns the reason an officer rejected or questioned the document. 


     */


    public String getRejectionReason() {
        return rejectionReason;
    }

    /**


     * Sets the reason an officer rejected or questioned the document on this object.


     */


    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

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

     * Returns the SHA-256 identifier used to recognise the same uploaded document. 

     */

    public String getFileFingerprint() { return fileFingerprint; }
    /**

     * Sets the SHA-256 identifier used to recognise the same uploaded document on this object.

     */

    public void setFileFingerprint(String fileFingerprint) { this.fileFingerprint = fileFingerprint; }

    /**


     * Returns the time the document was uploaded. 


     */


    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    /**


     * Returns the time the document record was last changed. 


     */


    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    /**


     * Returns the display name of the document. 


     */


    public String getDocumentName() {
        return documentName;
    }

    /**


     * Sets the display name of the document on this object.


     */


    public void setDocumentName(String documentName) {
        this.documentName = documentName;
    }

    /**


     * Returns the earlier document version linked to a resubmission. 


     */


    public Document getPreviousDocument() {
        return previousDocument;
    }

    /**


     * Sets the earlier document version linked to a resubmission on this object.


     */


    public void setPreviousDocument(Document previousDocument) {
        this.previousDocument = previousDocument;
    }

    @PrePersist
    /**

     * Handles the onCreate operation used by the MyDocs RSA backend.

     */

    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (status == null) {
            status = VerificationStatus.PENDING;
        }
    }

    @PreUpdate
    /**

     * Handles the onUpdate operation used by the MyDocs RSA backend.

     */

    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}