package com.documentverification.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordReset(String to, String code) {
        if (senderEmail == null || senderEmail.isBlank()) {
            throw new IllegalStateException("SMTP sender is not configured");
        }

        String text = "Your password reset code is " + code
                + ". It expires in 10 minutes. "
                + "If you did not request this, ignore this email.";

        sendEmail(to, "MyDocs RSA password reset", text);
    }

    public void sendTestEmail(String recipient) {
        String text = """
                Hello,

                This is a test email from the Document Verification System.

                If you received this email, the backend email configuration is working correctly.

                Regards,
                MyDocs RSA""";

        sendEmail(recipient, "Document Verification System - Test Email", text);
    }

    public void sendWelcomeEmail(String recipientEmail, String recipientName) {
        String text = "Hello " + recipientName + ",\n\n"
                + "Welcome to MyDocs RSA!\n\n"
                + "Your account has been successfully created.\n\n"
                + "You can now log in to MyDocs RSA and submit your documents "
                + "for digital certification.\n\n"
                + "Thank you for using MyDocs RSA.\n\n"
                + "MyDocs RSA Team";

        sendEmail(recipientEmail, "Welcome to MyDocs RSA", text);
    }

    public void sendDocumentStatusEmail(
            String recipient,
            String subject,
            String messageText) {
        sendEmail(recipient, subject, messageText);
    }

    private void sendEmail(String recipient, String subject, String messageText) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(messageText);
        mailSender.send(message);
    }
}