package com.documentverification.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.documentverification.backend.entity.CertificationRequest;
import com.documentverification.backend.entity.CertificationRequestStatus;
import com.documentverification.backend.entity.DigitalCredential;
import com.documentverification.backend.entity.Document;
import com.documentverification.backend.entity.DocumentType;
import com.documentverification.backend.entity.ProcessingPath;
import com.documentverification.backend.entity.User;
import com.documentverification.backend.repository.CertificationRequestRepository;
import com.documentverification.backend.repository.DigitalCredentialRepository;
import com.documentverification.backend.repository.UserRepository;

@Service
@org.springframework.transaction.annotation.Transactional
public class CertificationService {
    private final CertificationRequestRepository requestRepository;
    private final DigitalCredentialRepository credentialRepository;
    private final UserRepository userRepository;
    private final DocumentService documentService;
    private final int validityMonths;

    public CertificationService(CertificationRequestRepository requestRepository,
                                DigitalCredentialRepository credentialRepository,
                                UserRepository userRepository,
                                DocumentService documentService,
                                @Value("${app.credential.validity-months:6}") int validityMonths) {
        this.requestRepository = requestRepository;
        this.credentialRepository = credentialRepository;
        this.userRepository = userRepository;
        this.documentService = documentService;
        this.validityMonths = Math.max(3, Math.min(validityMonths, 6));
    }

    public Object createRequest(Long userId, DocumentType type, boolean hasCertifiedCopy, MultipartFile file) {
        return createRequest(userId, type, hasCertifiedCopy, file, null);
    }

    public Object createRequest(Long userId, DocumentType type, boolean hasCertifiedCopy, MultipartFile file, String otherDescription) {
        if (type == DocumentType.OTHER && (otherDescription == null || otherDescription.trim().length() < 3 || otherDescription.trim().length() > 120))
            throw new IllegalArgumentException("Specify the other document type (3–120 characters)");
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        // If this exact previously-verified file already has an active credential,
        // return the existing credential instead of sending it through verification again.
        String fingerprint = fingerprint(file);
        for (DigitalCredential c : credentialRepository.findByUserOrderByIssuedAtDesc(user)) {
            if (c.getDocument().getDocumentType() == type
                    && (type != DocumentType.OTHER || java.util.Objects.equals(c.getDocument().getOtherDescription(), otherDescription.trim()))
                    && c.getDocument().getFileFingerprint() != null
                    && c.getDocument().getFileFingerprint().equals(fingerprint)
                    && c.getStatus() == com.documentverification.backend.entity.CredentialStatus.ACTIVE
                    && c.getValidUntil() != null && c.getValidUntil().isAfter(java.time.LocalDateTime.now())) {
                return c;
            }
        }

        Document document = documentService.uploadDocument(userId, type, file, hasCertifiedCopy);
        document.setOtherDescription(type == DocumentType.OTHER ? otherDescription.trim() : null);
        CertificationRequest request = new CertificationRequest();
        request.setUser(user);
        request.setDocument(document);
        request.setHasCertifiedCopy(hasCertifiedCopy);
        request.setProcessingPath(hasCertifiedCopy ? ProcessingPath.FAST_TRACK_CERTIFIED_COPY : ProcessingPath.INVESTIGATION_REQUIRED);
        request.setStatus(CertificationRequestStatus.SUBMITTED);
        return requestRepository.save(request);
    }

    /** The user uploads a corrected file for a request the officer sent back. */
    public CertificationRequest resubmit(Long requestId, Long userId, MultipartFile file) {
        CertificationRequest r = getRequest(requestId);
        if (!r.getUser().getId().equals(userId))
            throw new RuntimeException("You are not allowed to resubmit this request");
        if (r.getStatus() != CertificationRequestStatus.RESUBMISSION_REQUIRED)
            throw new RuntimeException("This request is not waiting for a resubmission");

        Document next = documentService.resubmitDocument(r.getDocument().getId(), file);
        r.setDocument(next);
        r.setReviewedById(null); r.setReviewedByName(null); r.setReviewedAt(null);
        r.setStatus(CertificationRequestStatus.SUBMITTED);
        r.setNotes(null);
        r.touch();
        return requestRepository.save(r);
    }

    public List<CertificationRequest> getRequestsForUser(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        return requestRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<CertificationRequest> getPendingRequests() {
        return requestRepository.findByStatusOrderByCreatedAtAsc(CertificationRequestStatus.SUBMITTED);
    }

    public List<CertificationRequest> getInReviewRequests() {
        return requestRepository.findByStatusOrderByCreatedAtAsc(CertificationRequestStatus.UNDER_REVIEW);
    }

    public void cancelRequest(Long id, Long userId) {
        CertificationRequest r = getRequest(id);
        if (!r.getUser().getId().equals(userId)) throw new IllegalArgumentException("You cannot cancel another user's request");
        if (r.getStatus() != CertificationRequestStatus.SUBMITTED && r.getStatus() != CertificationRequestStatus.RESUBMISSION_REQUIRED && r.getStatus() != CertificationRequestStatus.REJECTED)
            throw new IllegalArgumentException("Only pending, returned or rejected requests can be removed");
        documentService.deleteDocumentForUser(r.getDocument().getId(), userId);
    }

    public CertificationRequest startReview(Long id, User officer) {
        CertificationRequest r = getRequest(id);
        if (r.getStatus() != CertificationRequestStatus.SUBMITTED && r.getStatus() != CertificationRequestStatus.INVESTIGATION_REQUIRED)
            throw new RuntimeException("Request is not awaiting review");
        r.setStatus(CertificationRequestStatus.UNDER_REVIEW);
        r.getDocument().setStatus(com.documentverification.backend.entity.VerificationStatus.UNDER_REVIEW);
        recordReviewer(r, officer, false);
        r.touch();
        return requestRepository.save(r);
    }

    public CertificationRequest approve(Long id, User officer) {
        CertificationRequest r = getRequest(id);
        if (r.getStatus() != CertificationRequestStatus.UNDER_REVIEW)
            throw new RuntimeException("Only requests under review can be approved");
        r.setStatus(CertificationRequestStatus.APPROVED);
        r.getDocument().setStatus(com.documentverification.backend.entity.VerificationStatus.APPROVED);
        r.getDocument().setRejectionReason(null);
        recordReviewer(r, officer, true);
        r.touch();
        requestRepository.save(r);

        DigitalCredential credential = credentialRepository.findByDocument(r.getDocument()).orElseGet(DigitalCredential::new);
        credential.setUser(r.getUser());
        credential.setDocument(r.getDocument());
        credential.setStatus(com.documentverification.backend.entity.CredentialStatus.ACTIVE);
        credential.setIssuedAt(java.time.LocalDateTime.now());
        credential.setValidUntil(java.time.LocalDateTime.now().plusMonths(validityMonths));
        credential.setRevokedAt(null); credential.setRevocationReason(null);
        return credentialRepository.save(credential).getId() != null ? r : r;
    }

    public CertificationRequest reject(Long id, String reason, User officer) {
        if (reason == null || reason.isBlank() || reason.trim().length() > 255) throw new RuntimeException("A rejection reason of 1–255 characters is required");
        CertificationRequest r = getRequest(id);
        if (r.getStatus() != CertificationRequestStatus.UNDER_REVIEW) throw new RuntimeException("Only requests under review can be rejected");
        r.setStatus(CertificationRequestStatus.REJECTED);
        r.getDocument().setStatus(com.documentverification.backend.entity.VerificationStatus.REJECTED);
        r.getDocument().setRejectionReason(reason);
        r.setNotes(reason); recordReviewer(r, officer, true); r.touch();
        return requestRepository.save(r);
    }

    public CertificationRequest requestMoreInformation(Long id, String reason, User officer) {
        if (reason == null || reason.isBlank() || reason.trim().length() > 255) throw new RuntimeException("A reason of 1–255 characters is required");
        CertificationRequest r = getRequest(id);
        if (r.getStatus() != CertificationRequestStatus.UNDER_REVIEW) throw new RuntimeException("Only requests under review can request more information");
        r.setStatus(CertificationRequestStatus.RESUBMISSION_REQUIRED);
        r.getDocument().setStatus(com.documentverification.backend.entity.VerificationStatus.RESUBMISSION_REQUIRED);
        r.getDocument().setRejectionReason(reason);
        r.setNotes(reason); recordReviewer(r, officer, true); r.touch();
        return requestRepository.save(r);
    }

    public DigitalCredential getCredentialForUser(Long credentialId, Long userId) {
        DigitalCredential c = credentialRepository.findById(credentialId).orElseThrow(() -> new RuntimeException("Credential not found"));
        if (!c.getUser().getId().equals(userId)) throw new RuntimeException("You are not allowed to access this credential");
        refreshExpiry(c); return c;
    }

    public List<DigitalCredential> getUserCredentials(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        List<DigitalCredential> list = credentialRepository.findByUserOrderByIssuedAtDesc(user);
        list.forEach(this::refreshExpiry);
        return list;
    }

    public DigitalCredential verifyCredential(String code) {
        DigitalCredential c = credentialRepository.findByVerificationCode(code)
                .orElseThrow(() -> new RuntimeException("Credential not found"));
        refreshExpiry(c);
        return c;
    }

    private void refreshExpiry(DigitalCredential c) {
        if (c.getStatus() == com.documentverification.backend.entity.CredentialStatus.ACTIVE
                && c.getValidUntil() != null && c.getValidUntil().isBefore(java.time.LocalDateTime.now())) {
            c.setStatus(com.documentverification.backend.entity.CredentialStatus.EXPIRED);
            credentialRepository.save(c);
        }
    }

    /** Audit trail: remember which officer picked up (decided=false) or decided (decided=true) the request. */
    private void recordReviewer(CertificationRequest r, User officer, boolean decided) {
        r.setReviewedById(officer.getId());
        r.setReviewedByName(officer.getFullName());
        r.setReviewedAt(decided ? java.time.LocalDateTime.now() : null);
    }

    private CertificationRequest getRequest(Long id) {
        return requestRepository.findById(id).orElseThrow(() -> new RuntimeException("Certification request not found"));
    }

    private String fingerprint(MultipartFile file) {
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256");
            return java.util.HexFormat.of().formatHex(digest.digest(file.getBytes()));
        } catch (Exception e) { throw new RuntimeException("Could not fingerprint document", e); }
    }
}
