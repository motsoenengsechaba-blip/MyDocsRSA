package com.documentverification.backend.service;

public final class PasswordPolicy {
    private PasswordPolicy() {}
    public static void validate(String password, String email, String name) {
        if (password == null || password.length() < 10 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72
                || !password.matches("(?s).*[a-z].*") || !password.matches("(?s).*[A-Z].*")
                || !password.matches("(?s).*[0-9].*") || !password.matches("(?s).*[^A-Za-z0-9].*"))
            throw new IllegalArgumentException("Use at least 10 characters, uppercase and lowercase letters, a number and a symbol (maximum 72 UTF-8 bytes)");
        String lower = password.toLowerCase(java.util.Locale.ROOT);
        for (String common : java.util.List.of("password", "passw0rd", "12345678", "123456789", "qwerty", "iloveyou", "letmein", "welcome", "admin123", "abc123"))
            if (lower.contains(common)) throw new IllegalArgumentException("Choose a less common password");
        String local = email.split("@")[0].toLowerCase(java.util.Locale.ROOT);
        if (local.length() >= 3 && lower.contains(local)) throw new IllegalArgumentException("Password must not contain your email");
        for (String part : name.toLowerCase(java.util.Locale.ROOT).split("\\s+"))
            if (part.length() >= 3 && lower.contains(part)) throw new IllegalArgumentException("Password must not contain your name");
    }
}
