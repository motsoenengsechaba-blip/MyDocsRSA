package com.documentverification.backend.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class DocumentValidationServiceTest {
    private final DocumentValidationService service = new DocumentValidationService();

    @Test
    void acceptsValidPdf() {
        var file = new MockMultipartFile("file", "document.pdf", "application/pdf", "%PDF-1.7 test".getBytes());
        assertDoesNotThrow(() -> service.validateUpload(file));
    }

    @Test
    void rejectsFakePdf() {
        var file = new MockMultipartFile("file", "document.pdf", "application/pdf", "not a pdf".getBytes());
        assertThrows(RuntimeException.class, () -> service.validateUpload(file));
    }

    @Test
    void rejectsOversizedFile() {
        var file = new MockMultipartFile("file", "document.pdf", "application/pdf", new byte[10 * 1024 * 1024 + 1]);
        assertThrows(RuntimeException.class, () -> service.validateUpload(file));
    }
}
