package com.documentverification.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Carries the officer's reason when a document is rejected or sent back for resubmission.
 */
public class ReviewRequest {

    @NotBlank(message = "Reason is required")
    @Size(max = 1000, message = "Reason must not exceed 1000 characters")
    private String reason;

    /**

     * Performs the operation represented by this method.

     */

    public ReviewRequest() {}

    /**


     * Returns the officer's explanation for rejection or requested resubmission. 


     */


    public String getReason() { return reason; }
    /**

     * Sets the officer's explanation for rejection or requested resubmission on this object.

     */

    public void setReason(String reason) { this.reason = reason; }
}
