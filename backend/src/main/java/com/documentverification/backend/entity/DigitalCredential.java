package com.documentverification.backend.entity;

import java.time.LocalDateTime;
import java.util.UUID;

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
import jakarta.persistence.Table;

@Entity
@Table(name = "digital_credentials")
/**
 * Represents the digital credential issued after a MyDocs RSA document has successfully passed verification.
 */
public class DigitalCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false, unique = true)
    private Document document;

    @Column(
            name = "verification_code",
            nullable = false,
            unique = true,
            length = 64
    )
    private String verificationCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CredentialStatus status;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "valid_until", nullable = false)
    private LocalDateTime validUntil;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "revocation_reason", length = 500)
    private String revocationReason;

    /**

     * Performs the operation represented by this method.

     */

    public DigitalCredential() {
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


     * Returns the document linked to this record. 


     */


    public Document getDocument() {
        return document;
    }

    /**


     * Sets the document linked to this record on this object.


     */


    public void setDocument(Document document) {
        this.document = document;
    }

    /**


     * Returns the credential verification code. 


     */


    public String getVerificationCode() {
        return verificationCode;
    }

    /**


     * Sets the credential verification code on this object.


     */


    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }

    /**


     * Returns the current verification or credential status. 


     */


    public CredentialStatus getStatus() {
        return status;
    }

    /**


     * Sets the current verification or credential status on this object.


     */


    public void setStatus(CredentialStatus status) {
        this.status = status;
    }

    /**


     * Returns when the digital credential was issued. 


     */


    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    /**


     * Sets when the digital credential was issued on this object.


     */


    public void setIssuedAt(LocalDateTime issuedAt) {
        this.issuedAt = issuedAt;
    }

    /**


     * Returns when the digital credential stops being valid. 


     */


    public LocalDateTime getValidUntil() {
        return validUntil;
    }

    /**


     * Sets when the digital credential stops being valid on this object.


     */


    public void setValidUntil(LocalDateTime validUntil) {
        this.validUntil = validUntil;
    }

    /**


     * Returns when the credential was revoked. 


     */


    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }

    /**


     * Sets when the credential was revoked on this object.


     */


    public void setRevokedAt(LocalDateTime revokedAt) {
        this.revokedAt = revokedAt;
    }

    /**


     * Returns why the credential was revoked. 


     */


    public String getRevocationReason() {
        return revocationReason;
    }

    /**


     * Sets why the credential was revoked on this object.


     */


    public void setRevocationReason(String revocationReason) {
        this.revocationReason = revocationReason;
    }

    @PrePersist
    void onCreate() {

        if (verificationCode == null) {
            verificationCode =
                    UUID.randomUUID()
                            .toString()
                            .replace("-", "")
                            .toUpperCase();
        }

        if (status == null) {
            status = CredentialStatus.ACTIVE;
        }

        if (issuedAt == null) {
            issuedAt = LocalDateTime.now();
        }
    }
}