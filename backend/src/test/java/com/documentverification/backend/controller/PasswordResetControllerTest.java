package com.documentverification.backend.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.Test;
import com.documentverification.backend.service.PasswordResetService;

class PasswordResetControllerTest {
    @Test void successfulRequestKeepsGenericResponse() {
        var service = mock(PasswordResetService.class);
        var response = new PasswordResetController(service).forgot(new PasswordResetController.Forgot("user@example.com"));
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().get("message").startsWith("If this email"));
        verify(service).request("user@example.com");
    }
    @Test void transportFailureDoesNotPretendCodeWasSent() {
        var service = mock(PasswordResetService.class);
        doThrow(new org.springframework.mail.MailAuthenticationException("SMTP authentication failed")).when(service).request("user@example.com");
        var response = new PasswordResetController(service).forgot(new PasswordResetController.Forgot("user@example.com"));
        assertEquals(503, response.getStatusCode().value());
        assertTrue(response.getBody().get("message").contains("temporarily unavailable"));
        assertFalse(response.getBody().get("message").contains("SMTP"));
    }
}
