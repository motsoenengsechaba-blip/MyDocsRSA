package com.documentverification.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.documentverification.backend.entity.User;
import com.documentverification.backend.repository.UserRepository;

class PasswordResetServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final EmailService email = mock(EmailService.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final PasswordResetService service = new PasswordResetService(users, encoder, email);
    private final User user = new User();
    private void setup() {
        user.setEmail("owner@example.com"); user.setFullName("Test Person"); user.setActive(true);
        user.setPassword(encoder.encode("Old!Secure782"));
        when(users.findForResetByEmail("owner@example.com")).thenReturn(Optional.of(user));
    }
    @Test void unknownEmailDoesNotSendMail() {
        when(users.findForResetByEmail(anyString())).thenReturn(Optional.empty());
        service.request("missing@example.com"); verifyNoInteractions(email);
        assertFalse(service.reset("missing@example.com", "123456", "New!Secure782"));
    }
    @Test void codeIsHashedSingleUseAndInvalidatesSessions() {
        setup(); service.request(" OWNER@example.com ");
        var code = ArgumentCaptor.forClass(String.class);
        verify(email).sendPasswordReset(eq("owner@example.com"), code.capture());
        assertNotEquals(code.getValue(), user.getResetCodeHash());
        assertTrue(service.reset(user.getEmail(), code.getValue(), "New!Secure782"));
        assertTrue(encoder.matches("New!Secure782", user.getPassword()));
        assertNull(user.getResetCodeHash()); assertEquals(1L, user.getAuthVersion());
        assertFalse(service.reset(user.getEmail(), code.getValue(), "Next!Secure782"));
    }
    @Test void expiryAndAttemptLimitRejectCodes() {
        setup(); user.setResetCodeHash(encoder.encode("654321"));
        user.setResetExpiresAt(LocalDateTime.now().minusSeconds(1));
        assertFalse(service.reset(user.getEmail(), "654321", "New!Secure782"));
        user.setResetExpiresAt(LocalDateTime.now().plusMinutes(10));
        for (int i=0;i<5;i++) assertFalse(service.reset(user.getEmail(), "000000", "New!Secure782"));
        assertEquals(5, user.getResetAttempts());
        assertFalse(service.reset(user.getEmail(), "654321", "New!Secure782"));
    }
    @Test void resendCooldownAndInactiveAccountsDoNotSend() {
        setup(); user.setResetSentAt(LocalDateTime.now()); service.request(user.getEmail());
        user.setResetSentAt(null); user.setActive(false); service.request(user.getEmail());
        verifyNoInteractions(email);
    }
    @Test void passwordPolicyRejectsWeakCommonAndPersonalPasswords() {
        assertThrows(IllegalArgumentException.class, () -> PasswordPolicy.validate("short", "owner@example.com", "Test Person"));
        assertThrows(IllegalArgumentException.class, () -> PasswordPolicy.validate("Password!1234", "owner@example.com", "Test Person"));
        assertThrows(IllegalArgumentException.class, () -> PasswordPolicy.validate("Owner!3948abc", "owner@example.com", "Test Person"));
        assertDoesNotThrow(() -> PasswordPolicy.validate("New!Secure782", "owner@example.com", "Test Person"));
    }
}
