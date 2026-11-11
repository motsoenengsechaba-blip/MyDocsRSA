package com.documentverification.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.documentverification.backend.entity.CertificationRequest;
import com.documentverification.backend.entity.CertificationRequestStatus;
import com.documentverification.backend.entity.User;

public interface CertificationRequestRepository extends JpaRepository<CertificationRequest, Long> {
    @Override
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    java.util.Optional<CertificationRequest> findById(Long id);
    List<CertificationRequest> findByUserOrderByCreatedAtDesc(User user);
    List<CertificationRequest> findByStatusOrderByCreatedAtAsc(CertificationRequestStatus status);

    /**

     * Deletes the matching MyDocs RSA records using Spring Data JPA so related account data can be cleaned up safely.

     */

    void deleteByUser(User user);

    /**

     * Deletes the matching MyDocs RSA records using Spring Data JPA so related account data can be cleaned up safely.

     */

    void deleteByDocument(com.documentverification.backend.entity.Document document);
}
