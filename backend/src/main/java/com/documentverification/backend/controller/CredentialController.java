package com.documentverification.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.documentverification.backend.dto.CredentialResponse;
import com.documentverification.backend.entity.DigitalCredential;
import com.documentverification.backend.entity.User;
import com.documentverification.backend.repository.UserRepository;
import com.documentverification.backend.service.CertificationService;

@RestController
@RequestMapping("/api/credentials")
public class CredentialController {
    private final CertificationService certificationService;
    private final UserRepository userRepository;

    /**

     * Performs the operation represented by this method.

     */

    public CredentialController(CertificationService certificationService, UserRepository userRepository) {
        this.certificationService = certificationService;
        this.userRepository = userRepository;
    }

    /**


     * Requests an existing credential for the authenticated user instead of creating a duplicate certification record.


     */


    public ResponseEntity<?> requestExisting(@PathVariable Long credentialId, Authentication authentication) {
        try {
            User user = userRepository.findByEmail(authentication.getName()).orElseThrow(() -> new RuntimeException("Authenticated user not found"));
            DigitalCredential credential = certificationService.getCredentialForUser(credentialId, user.getId());
            if (!credential.getStatus().name().equals("ACTIVE")) {
                return ResponseEntity.badRequest().body(Map.of("message", "This credential is no longer active and must be verified again", "status", credential.getStatus().name()));
            }
            return ResponseEntity.ok(Map.of("message", "Existing verified document returned", "credential", CredentialResponse.from(credential)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
