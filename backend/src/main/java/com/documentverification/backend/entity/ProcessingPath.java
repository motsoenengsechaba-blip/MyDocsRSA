package com.documentverification.backend.entity;

/**
 * Identifies whether a request uses the fast path for an existing certified copy or requires investigation.
 */
public enum ProcessingPath {
    FAST_TRACK_CERTIFIED_COPY,
    INVESTIGATION_REQUIRED
}
