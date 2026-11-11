package com.documentverification.backend.dto;

import com.documentverification.backend.entity.DocumentType;

import jakarta.validation.constraints.NotNull;

/**


 * Creates the CertificationRequestInput object used by the MyDocs RSA backend.


 */


/**
 * Carries the document type and certified-copy choice used when a certification request is created.
 */
public record CertificationRequestInput(@NotNull DocumentType documentType, boolean hasCertifiedCopy) {}
