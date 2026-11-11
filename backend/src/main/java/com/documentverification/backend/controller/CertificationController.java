package com.documentverification.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.documentverification.backend.dto.CertificationRequestResponse;
import com.documentverification.backend.dto.CredentialResponse;
import com.documentverification.backend.entity.CertificationRequest;
import com.documentverification.backend.entity.DigitalCredential;
import com.documentverification.backend.entity.DocumentType;
import com.documentverification.backend.entity.Role;
import com.documentverification.backend.entity.User;
import com.documentverification.backend.repository.UserRepository;
import com.documentverification.backend.service.CertificationService;

import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/certification")
public class CertificationController {
    private final CertificationService certificationService;
    private final UserRepository userRepository;

    public CertificationController(CertificationService certificationService, UserRepository userRepository) {
        this.certificationService = certificationService;
        this.userRepository = userRepository;
    }

    @PostMapping("/requests")
    public ResponseEntity<?> createRequest(@RequestParam DocumentType documentType,
                                            @RequestParam boolean hasCertifiedCopy,
                                            @RequestParam(required = false) String otherDescription,
                                            @RequestParam MultipartFile file,
                                            Authentication authentication) {
        try {
            User user = currentUser(authentication);
            if (user.getRole() != Role.USER) return forbidden();
            Object result = certificationService.createRequest(user.getId(), documentType, hasCertifiedCopy, file, otherDescription);
            if (result instanceof DigitalCredential credential) {
                return ResponseEntity.ok(Map.of(
                        "message", "This document already has a valid digital credential",
                        "reused", true,
                        "credential", CredentialResponse.from(credential)));
            }
            CertificationRequest request = (CertificationRequest) result;
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Certification request submitted",
                    "reused", false,
                    "request", CertificationRequestResponse.from(request)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/requests/{id}/resubmit")
    public ResponseEntity<?> resubmit(@PathVariable Long id,
                                      @RequestParam MultipartFile file,
                                      Authentication authentication) {
        try {
            User user = currentUser(authentication);
            if (user.getRole() != Role.USER) return forbidden();
            CertificationRequest request = certificationService.resubmit(id, user.getId(), file);
            return ResponseEntity.ok(Map.of(
                    "message", "Document resubmitted. Your request is back in the review queue.",
                    "request", CertificationRequestResponse.from(request)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/requests/{id}")
    public ResponseEntity<?> cancel(@PathVariable Long id, Authentication authentication) {
        try {
            User user = currentUser(authentication);
            if (user.getRole() != Role.USER) return forbidden();
            certificationService.cancelRequest(id, user.getId());
            return ResponseEntity.ok(Map.of("message", "Request removed"));
        } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @GetMapping("/requests/me")
    public ResponseEntity<?> myRequests(Authentication authentication) {
        try {
            User user = currentUser(authentication);
            return ResponseEntity.ok(certificationService.getRequestsForUser(user.getId()).stream()
                    .map(CertificationRequestResponse::from).toList());
        } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @GetMapping("/requests/pending")
    public ResponseEntity<?> pending(Authentication authentication) {
        if (!isOfficerOrAdmin(authentication)) return forbidden();
        return ResponseEntity.ok(certificationService.getPendingRequests().stream().map(CertificationRequestResponse::from).toList());
    }

    @GetMapping("/requests/in-review")
    public ResponseEntity<?> inReview(Authentication authentication) {
        if (!isOfficerOrAdmin(authentication)) return forbidden();
        return ResponseEntity.ok(certificationService.getInReviewRequests().stream().map(CertificationRequestResponse::from).toList());
    }

    @PutMapping("/requests/{id}/review")
    public ResponseEntity<?> review(@PathVariable Long id, Authentication authentication) {
        if (!isOfficerOrAdmin(authentication)) return forbidden();
        try { User officer = currentUser(authentication); return ResponseEntity.ok(CertificationRequestResponse.from(certificationService.startReview(id, officer))); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @PutMapping("/requests/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id, Authentication authentication) {
        if (!isOfficerOrAdmin(authentication)) return forbidden();
        try {
            User officer = currentUser(authentication);
            CertificationRequest request = certificationService.approve(id, officer);
            List<DigitalCredential> credentials = certificationService.getUserCredentials(request.getUser().getId());
            DigitalCredential credential = credentials.stream()
                    .filter(c -> c.getDocument().getId().equals(request.getDocument().getId()))
                    .findFirst().orElseThrow(() -> new RuntimeException("Credential was not created"));
            return ResponseEntity.ok(Map.of("message", "Certification approved", "request", CertificationRequestResponse.from(request), "credential", CredentialResponse.from(credential)));
        } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    public record ReasonRequest(@NotBlank String reason) {}

    @PutMapping("/requests/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody ReasonRequest body, Authentication authentication) {
        if (!isOfficerOrAdmin(authentication)) return forbidden();
        try { User officer = currentUser(authentication); return ResponseEntity.ok(CertificationRequestResponse.from(certificationService.reject(id, body.reason(), officer))); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @PutMapping("/requests/{id}/more-information")
    public ResponseEntity<?> moreInformation(@PathVariable Long id, @RequestBody ReasonRequest body, Authentication authentication) {
        if (!isOfficerOrAdmin(authentication)) return forbidden();
        try { User officer = currentUser(authentication); return ResponseEntity.ok(CertificationRequestResponse.from(certificationService.requestMoreInformation(id, body.reason(), officer))); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @GetMapping("/credentials/me")
    public ResponseEntity<?> myCredentials(Authentication authentication) {
        try {
            User user = currentUser(authentication);
            return ResponseEntity.ok(certificationService.getUserCredentials(user.getId()).stream().map(CredentialResponse::from).toList());
        } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @GetMapping("/credentials/{credentialId}")
    public ResponseEntity<?> credential(@PathVariable Long credentialId, Authentication authentication) {
        try {
            User user = currentUser(authentication);
            DigitalCredential c = certificationService.getCredentialForUser(credentialId, user.getId());
            return ResponseEntity.ok(CredentialResponse.from(c));
        } catch (RuntimeException e) { return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage())); }
    }

    /** Police scanner endpoint. The barcode/QR should contain only verificationCode, not personal data. */
    @GetMapping("/verify/{verificationCode}")
    public ResponseEntity<?> verifyCredential(@PathVariable String verificationCode, Authentication authentication) {
        if (!isOfficerOrAdmin(authentication)) return forbidden();
        try {
            DigitalCredential c = certificationService.verifyCredential(verificationCode);
            return ResponseEntity.ok(Map.of(
                    "valid", c.getStatus().name().equals("ACTIVE"),
                    "status", c.getStatus().name(),
                    "credentialId", c.getId(),
                    "documentType", c.getDocument().getDocumentType().name(),
                    "documentId", c.getDocument().getId(),
                    "holderName", c.getUser().getFullName(),
                    "validUntil", c.getValidUntil()));
        } catch (RuntimeException e) { return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("valid", false, "message", e.getMessage())); }
    }

    private User currentUser(Authentication a) { return userRepository.findByEmail(a.getName()).orElseThrow(() -> new RuntimeException("Authenticated user not found")); }
    private boolean isOfficerOrAdmin(Authentication a) {
        if (a == null || a.getAuthorities() == null) return false;
        return a.getAuthorities().stream().anyMatch(x -> x.getAuthority().equals("ROLE_POLICE_OFFICER") || x.getAuthority().equals("ROLE_ADMIN"));
    }
    private ResponseEntity<Map<String, String>> forbidden() { return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You are not allowed to access this endpoint")); }
}
