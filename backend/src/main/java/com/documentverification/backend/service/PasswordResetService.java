package com.documentverification.backend.service;

import java.time.LocalDateTime;
import java.util.Locale;
import java.security.SecureRandom;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.documentverification.backend.repository.UserRepository;

@Service
public class PasswordResetService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final EmailService email;
    private final SecureRandom random = new SecureRandom();
    public PasswordResetService(UserRepository users, PasswordEncoder encoder, EmailService email) {
        this.users = users; this.encoder = encoder; this.email = email;
    }
    @Transactional
    public void request(String address) {
        var user = users.findForResetByEmail(address.trim().toLowerCase(Locale.ROOT)).orElse(null);
        var now = LocalDateTime.now();
        if (user == null || !Boolean.TRUE.equals(user.getActive()) || (user.getResetSentAt() != null && user.getResetSentAt().plusMinutes(1).isAfter(now))) return;
        String code = String.format(Locale.ROOT, "%06d", random.nextInt(1000000));
        // Mail exceptions roll back the code; the controller still returns the generic response.
        email.sendPasswordReset(user.getEmail(), code);
        user.setResetCodeHash(encoder.encode(code)); user.setResetExpiresAt(now.plusMinutes(10));
        user.setResetSentAt(now); user.setResetAttempts(0); users.save(user);
    }
    @Transactional
    public boolean reset(String address, String code, String password) {
        var user = users.findForResetByEmail(address.trim().toLowerCase(Locale.ROOT)).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getActive()) || user.getResetCodeHash() == null || user.getResetExpiresAt() == null
                || !user.getResetExpiresAt().isAfter(LocalDateTime.now()) || user.getResetAttempts() >= 5) return false;
        user.setResetAttempts(user.getResetAttempts() + 1);
        if (!encoder.matches(code, user.getResetCodeHash())) { users.save(user); return false; }
        PasswordPolicy.validate(password, user.getEmail(), user.getFullName());
        user.setPassword(encoder.encode(password)); user.invalidateSessions(); user.setResetCodeHash(null); user.setResetExpiresAt(null);
        users.save(user); return true;
    }
}
