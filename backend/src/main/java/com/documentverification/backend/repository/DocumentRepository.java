package com.documentverification.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.documentverification.backend.entity.Document;
import com.documentverification.backend.entity.User;
import com.documentverification.backend.entity.VerificationStatus;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByUser(User user);

    List<Document> findByStatus(VerificationStatus status);

    List<Document> findByUserAndStatus(
            User user,
            VerificationStatus status
    );

    /**

     * Checks whether the specified MyDocs RSA document relationship already exists.

     */

    boolean existsByPreviousDocument(Document document);
}