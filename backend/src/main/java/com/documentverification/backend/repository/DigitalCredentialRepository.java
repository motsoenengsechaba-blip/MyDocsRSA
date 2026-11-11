package com.documentverification.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.documentverification.backend.entity.CredentialStatus;
import com.documentverification.backend.entity.DigitalCredential;
import com.documentverification.backend.entity.Document;
import com.documentverification.backend.entity.User;

public interface DigitalCredentialRepository extends JpaRepository<DigitalCredential, Long> {
    Optional<DigitalCredential> findByVerificationCode(String verificationCode);
    Optional<DigitalCredential> findByDocument(Document document);
    List<DigitalCredential> findByUserOrderByIssuedAtDesc(User user);
    List<DigitalCredential> findByUserAndStatusOrderByIssuedAtDesc(User user, CredentialStatus status);

    /**

     * Deletes the matching MyDocs RSA records using Spring Data JPA so related account data can be cleaned up safely.

     */

    void deleteByUser(User user);

    /**

     * Deletes the matching MyDocs RSA records using Spring Data JPA so related account data can be cleaned up safely.

     */

    void deleteByDocument(Document document);
}
