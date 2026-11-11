package com.documentverification.backend.dto;

import jakarta.validation.constraints.Size;

/**
 * Carries the editable account fields that a logged-in MyDocs RSA user can change.
 */
public class UpdateAccountRequest {

    private String fullName;

    private String phoneNumber;

    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

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
