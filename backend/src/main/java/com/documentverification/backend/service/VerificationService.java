package com.documentverification.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.documentverification.backend.entity.CredentialStatus;
import com.documentverification.backend.entity.DigitalCredential;
import com.documentverification.backend.entity.Document;
import com.documentverification.backend.entity.VerificationStatus;
import com.documentverification.backend.repository.DigitalCredentialRepository;
import com.documentverification.backend.repository.DocumentRepository;

@Service
public class VerificationService {

    private static final Logger logger =
            LoggerFactory.getLogger(VerificationService.class);

    private final DocumentRepository documentRepository;
    private final DigitalCredentialRepository digitalCredentialRepository;
    private final EmailService emailService;

    /**

     * Performs the operation represented by this method.

     */

    public VerificationService(
            DocumentRepository documentRepository,
            DigitalCredentialRepository digitalCredentialRepository,
            EmailService emailService) {

        this.documentRepository = documentRepository;
        this.digitalCredentialRepository = digitalCredentialRepository;
        this.emailService = emailService;
    }

    // ============================================================
    // GET PENDING DOCUMENTS
    // ============================================================

    /**


     * Finds documents in the PENDING state so police officers can see submissions that have not yet been reviewed.


     */


    public List<Document> getPendingDocuments() {

        return documentRepository.findByStatus(
                VerificationStatus.PENDING
        );
    }

    // ============================================================
    // START REVIEW
    // ============================================================

    /**


     * Moves a pending document to UNDER_REVIEW when a police officer begins authenticity checking.


     */


    public Document startReview(Long documentId) {

        Document document = getDocument(documentId);

        if (document.getStatus() != VerificationStatus.PENDING) {

            throw new RuntimeException(
                    "Only pending documents can be placed under review"
            );
        }

        document.setStatus(VerificationStatus.UNDER_REVIEW);

        return documentRepository.save(document);
    }

    // ============================================================
    // APPROVE DOCUMENT
    // ============================================================

    @Transactional
    /**

     * Marks the document as APPROVED and creates a six-month digital credential when one does not already exist.

     */

    public Document approveDocument(Long documentId) {

        Document document = getDocument(documentId);

        if (document.getStatus() != VerificationStatus.UNDER_REVIEW) {

            throw new RuntimeException(
                    "Only documents under review can be approved"
            );
        }

        // --------------------------------------------------------
        // APPROVE DOCUMENT
        // --------------------------------------------------------

        document.setStatus(VerificationStatus.APPROVED);
        document.setRejectionReason(null);

        Document savedDocument = documentRepository.save(document);

        // --------------------------------------------------------
        // CREATE DIGITAL CREDENTIAL
        // --------------------------------------------------------

        DigitalCredential credential =
                digitalCredentialRepository
                        .findByDocument(savedDocument)
                        .orElse(null);

        if (credential == null) {

            credential = new DigitalCredential();

            credential.setUser(savedDocument.getUser());
            credential.setDocument(savedDocument);
            credential.setStatus(CredentialStatus.ACTIVE);

            LocalDateTime issuedAt = LocalDateTime.now();

            credential.setIssuedAt(issuedAt);

            // Default credential validity:
            // 6 months from the date of approval.
            credential.setValidUntil(
                    issuedAt.plusMonths(6)
            );

            credential =
                    digitalCredentialRepository.save(credential);

            logger.info(
                    "Digital credential created for document ID {} with credential ID {}",
                    savedDocument.getId(),
                    credential.getId()
            );

        } else {

            logger.info(
                    "Digital credential already exists for document ID {}",
                    savedDocument.getId()
            );
        }

        // --------------------------------------------------------
        // SEND APPROVAL EMAIL
        // --------------------------------------------------------

        sendNotification(
                savedDocument,
                "Your document has been approved",
                """
                Hello,
                
                Your document has been successfully approved.
                
                Document type: """ + savedDocument.getDocumentType() + "\n" +
                "Document ID: " + savedDocument.getId() + "\n" +
                "Status: APPROVED\n\n" +
                "A digital credential has been created for this document.\n" +
                "You can now log in to MyDocs RSA to view your document.\n\n" +
                "Regards,\n" +
                "MyDocs RSA"
        );

        return savedDocument;
    }

    // ============================================================
    // REJECT DOCUMENT
    // ============================================================

    /**


     * Marks the document as REJECTED, stores the officer reason and notifies the user of the outcome.


     */


    public Document rejectDocument(
            Long documentId,
            String reason) {

        Document document = getDocument(documentId);

        if (document.getStatus() != VerificationStatus.UNDER_REVIEW) {

            throw new RuntimeException(
                    "Only documents under review can be rejected"
            );
        }

        if (reason == null || reason.isBlank()) {

            throw new RuntimeException(
                    "A rejection reason is required"
            );
        }

        document.setStatus(VerificationStatus.REJECTED);
        document.setRejectionReason(reason);

        Document savedDocument = documentRepository.save(document);

        sendNotification(
                savedDocument,
                "Your document verification was unsuccessful",
                """
                Hello,
                
                Unfortunately, your document was rejected.
                
                Document type: """ + savedDocument.getDocumentType() + "\n" +
                "Document ID: " + savedDocument.getId() + "\n" +
                "Status: REJECTED\n\n" +
                "Reason:\n" + reason + "\n\n" +
                "Please review the reason and submit a corrected document if required.\n\n" +
                "Regards,\n" +
                "MyDocs RSA"
        );

        return savedDocument;
    }

    // ============================================================
    // REQUEST RESUBMISSION
    // ============================================================

    /**


     * Marks the document as RESUBMISSION_REQUIRED when the officer needs the user to provide a corrected or clearer copy.


     */


    public Document requestResubmission(
            Long documentId,
            String reason) {

        Document document = getDocument(documentId);

        if (document.getStatus() != VerificationStatus.UNDER_REVIEW) {

            throw new RuntimeException(
                    "Only documents under review can require resubmission"
            );
        }

        if (reason == null || reason.isBlank()) {

            throw new RuntimeException(
                    "A reason for resubmission is required"
            );
        }

        document.setStatus(
                VerificationStatus.RESUBMISSION_REQUIRED
        );

        document.setRejectionReason(reason);

        Document savedDocument = documentRepository.save(document);

        sendNotification(
                savedDocument,
                "Action required: Please resubmit your document",
                """
                Hello,
                
                Your document requires correction and resubmission.
                
                Document type: """ + savedDocument.getDocumentType() + "\n" +
                "Document ID: " + savedDocument.getId() + "\n" +
                "Status: RESUBMISSION REQUIRED\n\n" +
                "Reason:\n" + reason + "\n\n" +
                "Please log in to MyDocs RSA and upload a corrected document.\n\n" +
                "Regards,\n" +
                "MyDocs RSA"
        );

        return savedDocument;
    }

    // ============================================================
    // SEND NOTIFICATION
    // ============================================================

    /**


     * Sends a MyDocs RSA email to the document owner describing the latest police verification result.


     */


    private void sendNotification(
            Document document,
            String subject,
            String message) {

        try {

            String recipient = document.getUser().getEmail();

            emailService.sendDocumentStatusEmail(
                    recipient,
                    subject,
                    message
            );

            logger.info(
                    "Notification sent for document ID {}",
                    document.getId()
            );

        } catch (MailException | IllegalStateException e) {

            logger.error(
                    "Document status was saved, but email notification failed for document ID {}",
                    document.getId(),
                    e
            );
        }
    }

    // ============================================================
    // FIND DOCUMENT
    // ============================================================

    /**


     * Loads a document by ID or stops the verification operation when that document does not exist.


     */


    private Document getDocument(Long documentId) {

        return documentRepository.findById(documentId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Document not found"
                        )
                );
    }
}