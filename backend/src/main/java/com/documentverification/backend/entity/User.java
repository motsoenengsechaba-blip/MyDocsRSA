package com.documentverification.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
/**
 * Represents a MyDocs RSA account. The role controls whether the account is a normal user, police officer or administrator.
 */
public class User {
    private Long authVersion = 0L;
    public long getAuthVersion() { return authVersion == null ? 0L : authVersion; }
    public void invalidateSessions() { authVersion = getAuthVersion() + 1; }
    private String resetCodeHash;
    private java.time.LocalDateTime resetExpiresAt;
    private java.time.LocalDateTime resetSentAt;
    private int resetAttempts;
    public String getResetCodeHash() { return resetCodeHash; }
    public void setResetCodeHash(String v) { resetCodeHash = v; }
    public java.time.LocalDateTime getResetExpiresAt() { return resetExpiresAt; }
    public void setResetExpiresAt(java.time.LocalDateTime v) { resetExpiresAt = v; }
    public java.time.LocalDateTime getResetSentAt() { return resetSentAt; }
    public void setResetSentAt(java.time.LocalDateTime v) { resetSentAt = v; }
    public int getResetAttempts() { return resetAttempts; }
    public void setResetAttempts(int v) { resetAttempts = v; }


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private Boolean active = true;

    /**

     * Performs the operation represented by this method.

     */

    public User() {
    }

    /**


     * Returns the database ID. 


     */


    public Long getId() {
        return id;
    }

    /**


     * Sets the database ID on this object.


     */


    public void setId(Long id) {
        this.id = id;
    }

    /**


     * Returns the user's full name. 


     */


    public String getFullName() {
        return fullName;
    }

    /**


     * Sets the user's full name on this object.


     */


    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    /**


     * Returns the account email address. 


     */


    public String getEmail() {
        return email;
    }

    /**


     * Sets the account email address on this object.


     */


    public void setEmail(String email) {
        this.email = email;
    }

    /**


     * Returns the user's encoded password. 


     */


    public String getPassword() {
        return password;
    }

    /**


     * Sets the user's encoded password on this object.


     */


    public void setPassword(String password) {
        this.password = password;
    }

    /**


     * Returns the account role used for MyDocs RSA access control. 


     */


    public Role getRole() {
        return role;
    }

    /**


     * Sets the account role used for MyDocs RSA access control on this object.


     */


    public void setRole(Role role) {
        this.role = role;
    }

    /**


     * Returns the user's phone number. 


     */


    public String getPhoneNumber() {
        return phoneNumber;
    }

    /**


     * Sets the user's phone number on this object.


     */


    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    /**


     * Returns the date and time the account was created. 


     */


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // Provided both getActive() and isActive() to prevent any method mismatch
    /**

     * Returns whether the account is active and allowed to log in. 

     */

    public Boolean getActive() {
        return active != null && active;
    }

    /**


     * Returns whether whether the account is active and allowed to log in is true.


     */


    public boolean isActive() {
        return active != null && active;
    }

    /**


     * Sets whether the account is active and allowed to log in on this object.


     */


    public void setActive(Boolean active) {
        this.active = active;
    }

    @PrePersist
    /**

     * Handles the onCreate operation used by the MyDocs RSA backend.

     */

    protected void onCreate() {
        createdAt = LocalDateTime.now();

        if (active == null) {
            active = true;
        }

        if (role == null) {
            role = Role.USER;
        }
    }
}