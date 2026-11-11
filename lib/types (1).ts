// These mirror the backend enums and DTOs (CertificationRequestResponse, CredentialResponse)

export type DocumentType =
  | 'ID_DOCUMENT'
  | 'PROOF_OF_RESIDENCE'
  | 'ACADEMIC_CERTIFICATE'
  | 'DRIVERS_LICENSE'
  | 'PROFESSIONAL_DRIVERS_PERMIT';

export const DOCUMENT_TYPES: { value: DocumentType; label: string; hint: string }[] = [
  { value: 'ID_DOCUMENT', label: 'ID document', hint: 'Smart ID card or green ID book' },
  { value: 'DRIVERS_LICENSE', label: "Driver's licence", hint: 'Your driving licence card' },
  { value: 'PROOF_OF_RESIDENCE', label: 'Proof of residence', hint: 'Utility bill, bank letter, etc.' },
  { value: 'ACADEMIC_CERTIFICATE', label: 'Academic certificate', hint: 'Matric or qualification certificate' },
  { value: 'PROFESSIONAL_DRIVERS_PERMIT', label: "Professional driver's permit", hint: 'PrDP' },
];

export function documentTypeLabel(type: string): string {
  return DOCUMENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export type RequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INVESTIGATION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED';

export type CertificationRequest = {
  requestId: number;
  documentId: number;
  documentType: DocumentType;
  hasCertifiedCopy: boolean;
  processingPath: 'FAST_TRACK_CERTIFIED_COPY' | 'INVESTIGATION_REQUIRED';
  status: RequestStatus;
  createdAt: string;
  updatedAt: string | null;
  notes: string | null;
  applicantName?: string;
  originalFileName?: string;
  reviewedByName?: string | null; // officer who picked up / decided it
  reviewedAt?: string | null; // when the decision was made
};

export type CredentialStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export type Credential = {
  credentialId: number;
  documentId: number;
  documentType: DocumentType;
  status: CredentialStatus;
  verificationCode: string;
  issuedAt: string;
  validUntil: string | null;
};

// POST /api/certification/requests answers with one of two shapes
export type CreateRequestResult = {
  message: string;
  reused: boolean;
  request?: CertificationRequest;
  credential?: Credential;
};

export const IN_PROGRESS_STATUSES: RequestStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'INVESTIGATION_REQUIRED',
  'RESUBMISSION_REQUIRED',
];
