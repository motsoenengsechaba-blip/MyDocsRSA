package com.documentverification.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import com.documentverification.backend.entity.*;
import com.documentverification.backend.repository.*;

class CertificationServiceTest {
    private final CertificationRequestRepository requests = mock(CertificationRequestRepository.class);
    private final DocumentService documents = mock(DocumentService.class);
    private final CertificationService service = new CertificationService(requests, mock(DigitalCredentialRepository.class), mock(UserRepository.class), documents, 6);
    private CertificationRequest request(CertificationRequestStatus status) {
        User user = mock(User.class); when(user.getId()).thenReturn(10L);
        Document document = mock(Document.class); when(document.getId()).thenReturn(20L);
        CertificationRequest r = new CertificationRequest(); r.setUser(user); r.setDocument(document); r.setStatus(status);
        when(requests.findById(1L)).thenReturn(Optional.of(r)); return r;
    }
    @Test void cancellationChecksOwnerAndStatus() {
        request(CertificationRequestStatus.SUBMITTED);
        assertThrows(IllegalArgumentException.class, () -> service.cancelRequest(1L, 99L));
        verifyNoInteractions(documents);
        service.cancelRequest(1L, 10L); verify(documents).deleteDocumentForUser(20L, 10L);
    }
    @Test void approvedAndUnderReviewRequestsCannotBeRemoved() {
        for (var status : java.util.List.of(CertificationRequestStatus.APPROVED, CertificationRequestStatus.UNDER_REVIEW)) {
            request(status); assertThrows(IllegalArgumentException.class, () -> service.cancelRequest(1L,10L));
        }
        verifyNoInteractions(documents);
    }
    @Test void rejectedAndReturnedRequestsCanBeRemoved() {
        request(CertificationRequestStatus.REJECTED); service.cancelRequest(1L,10L);
        request(CertificationRequestStatus.RESUBMISSION_REQUIRED); service.cancelRequest(1L,10L);
        verify(documents,times(2)).deleteDocumentForUser(20L,10L);
    }
    @Test void otherRequiresDescriptionBeforeUpload() {
        assertThrows(IllegalArgumentException.class, () -> service.createRequest(10L,DocumentType.OTHER,false,new MockMultipartFile("file",new byte[]{1})," "));
        verifyNoInteractions(documents);
    }
    @Test void rejectionReasonIsPersistedForApplicant() {
        var r = request(CertificationRequestStatus.UNDER_REVIEW); User officer = mock(User.class);
        when(officer.getId()).thenReturn(3L); when(officer.getFullName()).thenReturn("Officer");
        service.reject(1L,"Unreadable document",officer);
        assertEquals(CertificationRequestStatus.REJECTED,r.getStatus()); assertEquals("Unreadable document",r.getNotes());
        verify(r.getDocument()).setRejectionReason("Unreadable document");
    }
}
