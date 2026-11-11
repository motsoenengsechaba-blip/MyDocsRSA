package com.documentverification.backend.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.documentverification.backend.dto.RegisterRequest;
import com.documentverification.backend.entity.Role;
import com.documentverification.backend.entity.User;
import com.documentverification.backend.repository.UserRepository;
import com.documentverification.backend.repository.DocumentRepository;
import com.documentverification.backend.repository.CertificationRequestRepository;
import com.documentverification.backend.repository.DigitalCredentialRepository;
import com.documentverification.backend.entity.Document;
import com.documentverification.backend.security.JwtService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final DocumentRepository documentRepository;
    private final CertificationRequestRepository certificationRequestRepository;
    private final DigitalCredentialRepository digitalCredentialRepository;

    /**

     * Performs the operation represented by this method.

     */

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailService emailService,
            DocumentRepository documentRepository,
            CertificationRequestRepository certificationRequestRepository,
            DigitalCredentialRepository digitalCredentialRepository) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.documentRepository = documentRepository;
        this.certificationRequestRepository = certificationRequestRepository;
        this.digitalCredentialRepository = digitalCredentialRepository;
    }

    /**


     * Creates a normal USER account, securely hashes its password, saves it in the users table and sends the new user a MyDocs RSA welcome email.


     */


    public User register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new RuntimeException("Email address is already registered");
        }

        PasswordPolicy.validate(request.getPassword(), request.getEmail(), request.getFullName());
        User user = new User();

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());

        // New registrations are always normal users.
        user.setRole(Role.USER);
        user.setActive(true);

        // Save the user
        User savedUser = userRepository.save(user);

        // Send welcome email
        try {
            emailService.sendWelcomeEmail(
                    savedUser.getEmail(),
                    savedUser.getFullName());
        } catch (Exception e) {
            System.err.println("Could not send welcome email: " + e.getMessage());
        }

        return savedUser;
    }

    /**


     * Authenticates an existing MyDocs RSA account by email and password and rejects inactive or invalid accounts.


     */


    public User login(String email, String password) {

        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!user.getActive()) {
            throw new RuntimeException("Account is inactive");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        return user;
    }

    /**


     * Finds the account represented by the email extracted from the authenticated JWT.


     */


    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    /**


     * Updates the logged-in user's editable profile information and re-hashes the password when a new password is supplied.


     */


    public User updateCurrentUser(String email, String fullName, String phoneNumber, String password) {
        User user = getCurrentUser(email);

        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName.trim());
        }

        if (phoneNumber != null) {
            user.setPhoneNumber(phoneNumber.trim());
        }

        if (password != null && !password.isBlank()) {
            PasswordPolicy.validate(password, user.getEmail(), user.getFullName());
            user.setPassword(passwordEncoder.encode(password));
            user.invalidateSessions();
            user.setResetCodeHash(null); user.setResetExpiresAt(null);
        }

        return userRepository.save(user);
    }

    @org.springframework.transaction.annotation.Transactional
    /**

     * Permanently removes the logged-in account and its credentials, certification requests, documents and stored files while respecting database relationships.

     */

    public void deleteCurrentUser(String email) {
        User user = getCurrentUser(email);

        // Remove dependent records first so foreign-key constraints are respected.
        digitalCredentialRepository.deleteByUser(user);
        certificationRequestRepository.deleteByUser(user);

        // Delete newest documents first. This protects the previousDocument
        // relationship used by resubmissions.
        List<Document> documents = new java.util.ArrayList<>(documentRepository.findByUser(user));
        documents.sort(java.util.Comparator.comparing(
                Document::getUploadedAt,
                java.util.Comparator.nullsFirst(java.util.Comparator.naturalOrder())
        ).reversed());

        for (Document document : documents) {
            if (documentRepository.existsByPreviousDocument(document)) {
                throw new RuntimeException(
                        "This account contains a document history that could not be safely deleted"
                );
            }
            deletePhysicalFile(document);
            documentRepository.delete(document);
        }

        userRepository.delete(user);
    }

    /**


     * Deletes the physical uploaded document from the document-storage folder during account deletion.


     */


    private void deletePhysicalFile(Document document) {
        if (document.getFilePath() == null || document.getFilePath().isBlank()) {
            return;
        }

        try {
            java.nio.file.Path path = java.nio.file.Paths
                    .get(document.getFilePath())
                    .toAbsolutePath()
                    .normalize();

            if (java.nio.file.Files.exists(path)) {
                java.nio.file.Files.delete(path);
            }
        } catch (java.io.IOException e) {
            throw new RuntimeException("Could not delete stored document file", e);
        }
    }

    /**


     * Creates the JWT returned to the MyDocs RSA app after successful registration or login.


     */


    public String createToken(User user) {
        return jwtService.generateToken(user);
    }
}