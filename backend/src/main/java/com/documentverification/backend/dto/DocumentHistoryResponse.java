package com.documentverification.backend.dto;

import java.time.LocalDateTime;

import com.documentverification.backend.entity.DocumentType;
import com.documentverification.backend.entity.VerificationStatus;

/**
 * Represents one version in a MyDocs RSA document resubmission history.
 */
public class DocumentHistoryResponse {

    private Long documentId;
    private DocumentType documentType;
    private String fileName;
    private VerificationStatus status;
    private String rejectionReason;
    private LocalDateTime uploadedAt;
    private LocalDateTime updatedAt;
    private Long previousDocumentId;

    /**

     * Performs the operation represented by this method.

     */

    public DocumentHistoryResponse() {
    }

    /**

     * Performs the operation represented by this method.

     */

    public DocumentHistoryResponse(
            Long documentId,
            DocumentType documentType,
            String fileName,
            VerificationStatus status,
            String rejectionReason,
            LocalDateTime uploadedAt,
            LocalDateTime updatedAt,
            Long previousDocumentId) {

        this.documentId = documentId;
        this.documentType = documentType;
        this.fileName = fileName;
        this.status = status;
        this.rejectionReason = rejectionReason;
        this.uploadedAt = uploadedAt;
        this.updatedAt = updatedAt;
        this.previousDocumentId = previousDocumentId;
    }

    /**


     * Returns the value stored in this MyDocs RSA object. 


     */


    public Long getDocumentId() {
        return documentId;
    }

    /**


     * Sets the corresponding MyDocs RSA value on this object.


     */


    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
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


     * Returns the value stored in this MyDocs RSA object. 


     */


    public String getFileName() {
        return fileName;
    }

    /**


     * Sets the corresponding MyDocs RSA value on this object.


     */


    public void setFileName(String fileName) {
        this.fileName = fileName;
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


     * Returns the time the document was uploaded. 


     */


    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    /**


     * Sets the time the document was uploaded on this object.


     */


    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    /**


     * Returns the time the document record was last changed. 


     */


    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    /**


     * Sets the time the document record was last changed on this object.


     */


    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    /**


     * Returns the value stored in this MyDocs RSA object. 


     */


    public Long getPreviousDocumentId() {
        return previousDocumentId;
    }

    /**


     * Sets the corresponding MyDocs RSA value on this object.


     */


    public void setPreviousDocumentId(Long previousDocumentId) {
        this.previousDocumentId = previousDocumentId;
    }
}