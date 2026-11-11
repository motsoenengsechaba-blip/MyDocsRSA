package com.documentverification.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

import org.junit.jupiter.api.Test;

import com.documentverification.backend.dto.AdminStatsResponse;
import com.documentverification.backend.dto.AdminUserResponse;
import com.documentverification.backend.entity.CertificationRequest;
import com.documentverification.backend.entity.CertificationRequestStatus;
import com.documentverification.backend.entity.CredentialStatus;
import com.documentverification.backend.entity.DigitalCredential;
import com.documentverification.backend.entity.Document;
import com.documentverification.backend.entity.DocumentType;
import com.documentverification.backend.entity.ProcessingPath;
import com.documentverification.backend.entity.Role;
import com.documentverification.backend.entity.User;
import com.documentverification.backend.repository.CertificationRequestRepository;
import com.documentverification.backend.repository.DigitalCredentialRepository;
import com.documentverification.backend.repository.UserRepository;

/**
 * Unit tests for the admin dashboard logic. No database and no Spring needed:
 * the repositories are replaced by small in-memory fakes.
 */
class AdminServiceTest {

    private static final String ADMIN_EMAIL = "admin@test.com";

    /** The sample data every test starts from. */
    private static class Fixture {
        final User admin = user(1, "Ada Admin", ADMIN_EMAIL, Role.ADMIN, true);
        final User officer = user(2, "Olivia Officer", "officer@test.com", Role.POLICE_OFFICER, true);
        final User joy = user(3, "Joy", "joy@test.com", Role.USER, true);
        final User sam = user(4, "Sam", "sam@test.com", Role.USER, false);
        final List<User> users = new ArrayList<>(List.of(admin, officer, joy, sam));
        final List<CertificationRequest> requests = new ArrayList<>();
        final List<DigitalCredential> credentials = new ArrayList<>();
        final List<User> saved = new ArrayList<>();
        final Document document = new Document();

        Fixture() {
            document.setDocumentType(DocumentType.ID_DOCUMENT);
            addRequest(joy, CertificationRequestStatus.SUBMITTED, null);
            addRequest(joy, CertificationRequestStatus.UNDER_REVIEW, officer);       // picked up, not decided yet
            addRequest(sam, CertificationRequestStatus.APPROVED, officer);
            addRequest(sam, CertificationRequestStatus.REJECTED, officer);
            addRequest(sam, CertificationRequestStatus.RESUBMISSION_REQUIRED, officer);
            credentials.add(credential(LocalDateTime.now().plusMonths(6)));          // active
            credentials.add(credential(LocalDateTime.now().minusDays(1)));           // ended yesterday
        }

        void addRequest(User owner, CertificationRequestStatus status, User reviewer) {
            CertificationRequest r = new CertificationRequest();
            r.setUser(owner);
            r.setDocument(document);
            r.setStatus(status);
            r.setProcessingPath(ProcessingPath.INVESTIGATION_REQUIRED);
            if (reviewer != null) {
                r.setReviewedById(reviewer.getId());
                r.setReviewedByName(reviewer.getFullName());
                r.setReviewedAt(status == CertificationRequestStatus.UNDER_REVIEW ? null : LocalDateTime.now());
            }
            requests.add(r);
        }

        DigitalCredential credential(LocalDateTime validUntil) {
            DigitalCredential c = new DigitalCredential();
            c.setUser(joy);
            c.setDocument(document);
            c.setStatus(CredentialStatus.ACTIVE);
            c.setValidUntil(validUntil);
            return c;
        }

        AdminService service() {
            UserRepository userRepo = fake(UserRepository.class, Map.of(
                    "findAll", a -> users,
                    "findById", a -> users.stream().filter(u -> u.getId().equals(a[0])).findFirst(),
                    "save", a -> {
                        saved.add((User) a[0]);
                        return a[0];
                    }));
            CertificationRequestRepository requestRepo = fake(CertificationRequestRepository.class, Map.of(
                    "findAll", a -> requests,
                    "findByUserOrderByCreatedAtDesc", a -> requests.stream().filter(r -> r.getUser() == a[0]).toList()));
            DigitalCredentialRepository credentialRepo = fake(DigitalCredentialRepository.class, Map.of(
                    "findAll", a -> credentials));
            return new AdminService(userRepo, requestRepo, credentialRepo);
        }
    }

    private static User user(long id, String name, String email, Role role, boolean active) {
        User u = new User();
        u.setId(id);
        u.setFullName(name);
        u.setEmail(email);
        u.setRole(role);
        u.setActive(active);
        return u;
    }

    @SuppressWarnings("unchecked")
    private static <T> T fake(Class<T> type, Map<String, Function<Object[], Object>> methods) {
        return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] { type }, (proxy, method, args) -> {
            Function<Object[], Object> impl = methods.get(method.getName());
            if (impl == null) {
                throw new UnsupportedOperationException(method.getName());
            }
            return impl.apply(args == null ? new Object[0] : args);
        });
    }

    // ---------- statistics ----------

    @Test
    void statsCountUsersByRoleAndInactive() {
        AdminStatsResponse.UserStats s = new Fixture().service().getStats().users();
        assertEquals(4, s.total());
        assertEquals(2, s.users());
        assertEquals(1, s.officers());
        assertEquals(1, s.admins());
        assertEquals(1, s.inactive());
    }

    @Test
    void statsCountRequestsByStatus() {
        AdminStatsResponse.RequestStats s = new Fixture().service().getStats().requests();
        assertEquals(5, s.total());
        assertEquals(1, s.waiting());
        assertEquals(1, s.underReview());
        assertEquals(1, s.approved());
        assertEquals(1, s.rejected());
        assertEquals(1, s.resubmissionRequired());
    }

    @Test
    void statsTreatACredentialPastItsEndDateAsExpired() {
        AdminStatsResponse.CredentialStats s = new Fixture().service().getStats().credentials();
        assertEquals(2, s.total());
        assertEquals(1, s.active());
        assertEquals(1, s.expired());
        assertEquals(0, s.revoked());
    }

    // ---------- user list ----------

    @Test
    void officerDecisionCountIgnoresRequestsThatAreNotDecidedYet() {
        List<AdminUserResponse> list = new Fixture().service().getUsers();
        AdminUserResponse officer = list.stream().filter(u -> u.id() == 2).findFirst().orElseThrow();
        assertEquals(3, officer.reviewedCount());
    }

    @Test
    void userListShowsHowManyRequestsEachPersonSubmitted() {
        List<AdminUserResponse> list = new Fixture().service().getUsers();
        assertEquals(2, list.stream().filter(u -> u.id() == 3).findFirst().orElseThrow().requestCount());
        assertEquals(3, list.stream().filter(u -> u.id() == 4).findFirst().orElseThrow().requestCount());
    }

    @Test
    void userListNeverContainsAPasswordField() {
        boolean hasPassword = java.util.Arrays.stream(AdminUserResponse.class.getRecordComponents())
                .anyMatch(c -> c.getName().toLowerCase().contains("password"));
        assertFalse(hasPassword);
    }

    // ---------- officer management rules ----------

    @Test
    void adminCanPromoteAUserToOfficer() {
        Fixture f = new Fixture();
        AdminUserResponse result = f.service().changeRole(3L, Role.POLICE_OFFICER, ADMIN_EMAIL);
        assertEquals("POLICE_OFFICER", result.role());
        assertEquals(1, f.saved.size());
    }

    @Test
    void adminCannotGrantTheAdminRole() {
        AdminService service = new Fixture().service();
        assertThrows(RuntimeException.class, () -> service.changeRole(3L, Role.ADMIN, ADMIN_EMAIL));
    }

    @Test
    void adminCannotChangeAnotherAdminAccount() {
        AdminService service = new Fixture().service();
        assertThrows(RuntimeException.class, () -> service.changeRole(1L, Role.USER, ADMIN_EMAIL));
    }

    @Test
    void adminCannotDeactivateTheirOwnAccount() {
        AdminService service = new Fixture().service();
        assertThrows(RuntimeException.class, () -> service.setActive(1L, false, ADMIN_EMAIL));
    }

    @Test
    void unknownUserIsRejected() {
        AdminService service = new Fixture().service();
        assertThrows(RuntimeException.class, () -> service.changeRole(99L, Role.USER, ADMIN_EMAIL));
    }

    @Test
    void aDeactivatedUserCanBeReactivated() {
        AdminUserResponse result = new Fixture().service().setActive(4L, true, ADMIN_EMAIL);
        assertTrue(result.active());
    }
}
