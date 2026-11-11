package com.documentverification.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

class EmailServiceTest {
    @Test void resetMessageHasConfiguredSenderRecipientCodeAndExpiry() {
        JavaMailSender sender = mock(JavaMailSender.class);
        EmailService service = new EmailService(sender);
        ReflectionTestUtils.setField(service,"senderEmail","sender@example.com");
        service.sendPasswordReset("recipient@example.com","123456");
        var capture = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(capture.capture());
        var message = capture.getValue();
        assertEquals("sender@example.com",message.getFrom());
        assertArrayEquals(new String[]{"recipient@example.com"},message.getTo());
        assertTrue(message.getText().contains("123456"));
        assertTrue(message.getText().contains("10 minutes"));
    }
    @Test void emptySenderIsRejectedBeforeDelivery() {
        JavaMailSender sender = mock(JavaMailSender.class);
        EmailService service = new EmailService(sender);
        ReflectionTestUtils.setField(service,"senderEmail", "");
        assertThrows(IllegalStateException.class,()->service.sendPasswordReset("recipient@example.com","123456"));
        verifyNoInteractions(sender);
    }
}
