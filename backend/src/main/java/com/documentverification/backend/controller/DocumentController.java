package com.documentverification.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.documentverification.backend.dto.DocumentHistoryResponse;
import com.documentverification.backend.dto.DocumentResponse;
import com.documentverification.backend.entity.Document;
import com.documentverification.backend.entity.DocumentType;
import com.documentverification.backend.entity.Role;
import com.documentverification.backend.entity.User;
import com.documentverification.backend.repository.UserRepository;
import com.documentverification.backend.service.DocumentService;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;

    /**

     * Performs the operation represented by this method.

     */

    public DocumentController(DocumentService documentService, UserRepository userRepository) {
        this.documentService = documentService;
        this.userRepository = userRepository;
    }

    @PostMapping("/upload")
    /**

     * Uploads a user document for verification and records whether the user supplied an existing police-certified copy.

     */

    public ResponseEntity<?> uploadDocument(
            @RequestParam Long userId,
            @RequestParam DocumentType documentType,
            @RequestParam MultipartFile file,
            Authentication authentication) {
        try {
            User user = currentUser(authentication);
            if (user.getRole() != Role.USER || !user.getId().equals(userId)) {
                return forbidden();
            }
            Document document = documentService.uploadDocument(userId, documentType, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Document uploaded successfully",
                    "documentId", document.getId(),
                    "documentType", document.getDocumentType().name(),
                    "status", document.getStatus().name(),
                    "fileName", document.getOriginalFileName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    /**

     * Returns the documents belonging to the requested user, while enforcing the access rules for the authenticated account.

     */

    public ResponseEntity<?> getUserDocuments(@PathVariable Long userId, Authentication authentication) {
        try {
            User user = currentUser(authentication);
            if (user.getRole() == Role.USER && !user.getId().equals(userId)) return forbidden();
            List<DocumentResponse> documents = documentService.getDocumentsByUser(userId).stream()
                    .map(DocumentResponse::from).toList();
            return ResponseEntity.ok(documents);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{documentId}")
    /**

     * Returns one document when the authenticated user is allowed to access it.

     */

    public ResponseEntity<?> getDocument(@PathVariable Long documentId, Authentication authentication) {
        try {
            Document document = documentService.getDocumentById(documentId);
            if (!canAccessDocument(authentication, document)) return forbidden();
            return ResponseEntity.ok(DocumentResponse.from(document));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/resubmit")
    /**

     * Uploads a replacement file for a document that the verification process has marked as requiring resubmission.

     */

    public ResponseEntity<?> resubmitDocument(
            @RequestParam Long previousDocumentId,
            @RequestParam MultipartFile file,
            Authentication authentication) {
        try {
            Document previous = documentService.getDocumentById(previousDocumentId);
            User user = currentUser(authentication);
            if (user.getRole() != Role.USER || !user.getId().equals(previous.getUser().getId())) return forbidden();
            Document document = documentService.resubmitDocument(previousDocumentId, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Document resubmitted successfully",
                    "documentId", document.getId(),
                    "previousDocumentId", document.getPreviousDocument().getId(),
                    "documentType", document.getDocumentType().name(),
                    "status", document.getStatus().name(),
                    "fileName", document.getOriginalFileName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{documentId}")
    /**

     * Permanently deletes an eligible document owned by the authenticated user, including its stored file, without allowing deletion of protected verification records.

     */

    public ResponseEntity<?> deleteDocument(
            @PathVariable Long documentId,
            Authentication authentication) {

        try {
            User user = currentUser(authentication);

            if (user.getRole() != Role.USER) {
                return forbidden();
            }

            documentService.deleteDocumentForUser(
                    documentId,
                    user.getId()
            );

            return ResponseEntity.ok(
                    Map.of("message", "Document deleted successfully")
            );

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{documentId}/history")
    /**

     * Returns the resubmission history for a document so the user or authorised staff can see how the document moved through verification.

     */

    public ResponseEntity<?> getDocumentHistory(@PathVariable Long documentId, Authentication authentication) {
        try {
            Document document = documentService.getDocumentById(documentId);
            if (!canAccessDocument(authentication, document)) return forbidden();
            List<DocumentHistoryResponse> history = documentService.getDocumentHistory(documentId);
            return ResponseEntity.ok(history);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{documentId}/download")
    /**

     * Downloads the stored original document after checking that the authenticated user is allowed to access it.

     */

    public ResponseEntity<?> downloadDocument(@PathVariable Long documentId, Authentication authentication) {
        try {
            Document document = documentService.getDocumentById(documentId);
            if (!canAccessDocument(authentication, document)) return forbidden();
            Resource resource = documentService.downloadDocument(documentId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getOriginalFileName().replace("\"", "") + "\"")
                    .body(resource);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**


     * Loads the currently authenticated MyDocs RSA user from the email stored in the JWT.


     */


    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    /**


     * Checks document ownership and role rules before allowing a user, officer or administrator to access the document.


     */


    private boolean canAccessDocument(Authentication authentication, Document document) {
        User user = currentUser(authentication);
        return user.getRole() != Role.USER || user.getId().equals(document.getUser().getId());
    }

    /**


     * Creates the standard forbidden response used when a caller does not have permission to access a document.


     */


    private ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You are not allowed to access this document"));
    }
}
