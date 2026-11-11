package com.documentverification.backend.dto;

/**
 * The numbers shown on the admin dashboard.
 */
public record AdminStatsResponse(UserStats users, RequestStats requests, CredentialStats credentials) {

    public record UserStats(long total, long users, long officers, long admins, long inactive) {}

    /** "waiting" = submitted and not yet picked up by an officer. */
    public record RequestStats(long total, long waiting, long underReview, long approved,
                               long rejected, long resubmissionRequired) {}

    public record CredentialStats(long total, long active, long expired, long revoked) {}
}
