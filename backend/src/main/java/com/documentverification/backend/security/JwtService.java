package com.documentverification.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.documentverification.backend.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final Key signingKey;
    private final long expirationMs;
    private final com.documentverification.backend.repository.UserRepository users;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs, com.documentverification.backend.repository.UserRepository users) {
        this.users = users;
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("app.jwt.secret must be at least 32 characters");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**


     * Creates the JWT that the MyDocs RSA app uses to prove the user's identity on protected API requests.


     */


    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .claim("authVersion", user.getAuthVersion())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**


     * Reads the user email stored in a MyDocs RSA JWT so the backend knows which account made the request.


     */


    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    /**


     * Checks that a JWT is correctly signed, has not expired and belongs to the expected user email.


     */


    public boolean isValid(String token, String expectedEmail) {
        try {
            Claims claims = parseClaims(token);
            return expectedEmail.equals(claims.getSubject())
                    && claims.getExpiration().after(new Date())
                    && users.findByEmail(expectedEmail).map(user -> {
                        Number version = claims.get("authVersion", Number.class);
                        return user.getAuthVersion() == (version == null ? 0L : version.longValue());
                    }).orElse(false);
        } catch (RuntimeException e) {
            return false;
        }
    }

    /**


     * Parses the signed JWT and returns its claims for the authentication checks.


     */


    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
