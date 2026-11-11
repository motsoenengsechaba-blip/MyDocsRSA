package com.documentverification.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Carries the email and password supplied when a user logs into MyDocs RSA.
 */
public class LoginRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;

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
}