package com.documentverification.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Carries the information supplied by a new MyDocs RSA user when creating an account.
 */
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    private String phoneNumber;

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
}