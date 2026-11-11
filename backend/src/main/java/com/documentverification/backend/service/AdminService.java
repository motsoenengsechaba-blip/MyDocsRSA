package com.documentverification.backend.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.documentverification.backend.dto.AdminCredentialResponse;
import com.documentverification.backend.dto.AdminStatsResponse;
import com.documentverification.backend.dto.AdminUserResponse;
import com.documentverification.backend.dto.CertificationRequestResponse;
import com.documentverification.backend.entity.CertificationRequest;
import com.documentverification.backend.entity.CertificationRequestStatus;
import com.documentverification.backend.entity.DigitalCredential;
import com.documentverification.backend.entity.Role;
import com.documentverification.backend.entity.User;
import com.documentverification.backend.repository.CertificationRequestRepository;
import com.documentverification.backend.repository.DigitalCredentialRepository;
import com.documentverification.backend.repository.UserRepository;

/**
 * Read-only monitoring for the admin dashboard, plus officer management
 * (promote a user to officer, remove the officer role, activate/deactivate an account).
 *
 * The admin never approves or rejects requests: that stays with POLICE_OFFICER accounts.
 * Counting is done in memory, which is fine for the size of this project.
 */
@Service
public class AdminService {

    private final UserRepository userRepository;
    private final CertificationRequestRepository requestRepository;
    private final DigitalCredentialRepository credentialRepository;

    public AdminService(UserRepository userRepository,
                        CertificationRequestRepository requestRepository,
                        DigitalCredentialRepository credentialRepository) {
        this.userRepository = userRepository;
        this.requestRepository = requestRepository;
        this.credentialRepository = credentialRepository;
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        List<User> users = userRepository.findAll();
        List<CertificationRequest> requests = requestRepository.findAll();
        List<DigitalCredential> credentials = credentialRepository.findAll();

        AdminStatsResponse.UserStats userStats = new AdminStatsResponse.UserStats(
                users.size(),
                users.stream().filter(u -> u.getRole() == Role.USER).count(),
                users.stream().filter(u -> u.getRole() == Role.POLICE_OFFICER).count(),
                users.stream().filter(u -> u.getRole() == Role.ADMIN).count(),
                users.stream().filter(u -> !u.isActive()).count());

        long waiting = requests.stream()
                .filter(r -> r.getStatus() == CertificationRequestStatus.SUBMITTED
                        || r.getStatus() == CertificationRequestStatus.INVESTIGATION_REQUIRED)
                .count();
        AdminStatsResponse.RequestStats requestStats = new AdminStatsResponse.RequestStats(
                requests.size(),
                waiting,
                countStatus(requests, CertificationRequestStatus.UNDER_REVIEW),
                countStatus(requests, CertificationRequestStatus.APPROVED),
                countStatus(requests, CertificationRequestStatus.REJECTED),
                countStatus(requests, CertificationRequestStatus.RESUBMISSION_REQUIRED));

        AdminStatsResponse.CredentialStats credentialStats = new AdminStatsResponse.CredentialStats(
                credentials.size(),
                credentials.stream().filter(c -> "ACTIVE".equals(AdminCredentialResponse.effectiveStatus(c))).count(),
                credentials.stream().filter(c -> "EXPIRED".equals(AdminCredentialResponse.effectiveStatus(c))).count(),
                credentials.stream().filter(c -> "REVOKED".equals(AdminCredentialResponse.effectiveStatus(c))).count());

        return new AdminStatsResponse(userStats, requestStats, credentialStats);
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers() {
        Map<Long, Long> submitted = new HashMap<>();
        Map<Long, Long> reviewed = new HashMap<>();
        for (CertificationRequest r : requestRepository.findAll()) {
            submitted.merge(r.getUser().getId(), 1L, Long::sum);
            if (r.getReviewedById() != null && r.getReviewedAt() != null) {
                reviewed.merge(r.getReviewedById(), 1L, Long::sum);
            }
        }
        return userRepository.findAll().stream()
                .sorted((a, b) -> newestFirst(a.getCreatedAt(), b.getCreatedAt()))
                .map(u -> AdminUserResponse.from(u,
                        submitted.getOrDefault(u.getId(), 0L),
                        reviewed.getOrDefault(u.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CertificationRequestResponse> getRequests() {
        return requestRepository.findAll().stream()
                .sorted((a, b) -> newestFirst(a.getCreatedAt(), b.getCreatedAt()))
                .map(CertificationRequestResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminCredentialResponse> getCredentials() {
        return credentialRepository.findAll().stream()
                .sorted((a, b) -> newestFirst(a.getIssuedAt(), b.getIssuedAt()))
                .map(AdminCredentialResponse::from)
                .toList();
    }

    /** Promote a USER to POLICE_OFFICER, or turn an officer back into a USER. */
    @Transactional
    public AdminUserResponse changeRole(Long targetId, Role newRole, String adminEmail) {
        if (newRole != Role.USER && newRole != Role.POLICE_OFFICER) {
            throw new RuntimeException("The role can only be set to USER or POLICE_OFFICER");
        }
        User target = findManageableUser(targetId, adminEmail);
        target.setRole(newRole);
        userRepository.save(target);
        return toResponse(target);
    }

    /** Switch an account on or off. A deactivated account is locked out immediately. */
    @Transactional
    public AdminUserResponse setActive(Long targetId, boolean active, String adminEmail) {
        User target = findManageableUser(targetId, adminEmail);
        target.setActive(active);
        userRepository.save(target);
        return toResponse(target);
    }

    // ----- helpers -----

    private User findManageableUser(Long targetId, String adminEmail) {
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (target.getRole() == Role.ADMIN) {
            throw new RuntimeException("Admin accounts cannot be changed from the app");
        }
        if (target.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new RuntimeException("You cannot change your own account");
        }
        return target;
    }

    private AdminUserResponse toResponse(User u) {
        long submitted = requestRepository.findByUserOrderByCreatedAtDesc(u).size();
        long reviewed = requestRepository.findAll().stream()
                .filter(r -> u.getId().equals(r.getReviewedById()) && r.getReviewedAt() != null)
                .count();
        return AdminUserResponse.from(u, submitted, reviewed);
    }

    private static long countStatus(List<CertificationRequest> requests, CertificationRequestStatus status) {
        return requests.stream().filter(r -> r.getStatus() == status).count();
    }

    private static int newestFirst(LocalDateTime a, LocalDateTime b) {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        return b.compareTo(a);
    }
}
