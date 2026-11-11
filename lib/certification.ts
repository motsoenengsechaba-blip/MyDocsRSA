import { apiRequest, apiUpload } from '@/lib/api';
import type { PickedFile } from '@/lib/files';
import type { CertificationRequest, CreateRequestResult, Credential, DocumentType } from '@/lib/types';

export function fetchMyRequests() {
  return apiRequest<CertificationRequest[]>('/api/certification/requests/me');
}

export function fetchMyCredentials() {
  return apiRequest<Credential[]>('/api/certification/credentials/me');
}

/** Everything the "My Documents" screens need, loaded together. */
export async function fetchMyDocuments() {
  const [requests, credentials] = await Promise.all([fetchMyRequests(), fetchMyCredentials()]);
  return { requests, credentials };
}

export function submitRequest(input: {
  documentType: DocumentType;
  otherDescription?: string; // required when documentType is OTHER
  hasCertifiedCopy: boolean;
  file: PickedFile;
}) {
  return apiUpload<CreateRequestResult>('/api/certification/requests', {
    file: input.file,
    fields: {
      documentType: input.documentType,
      hasCertifiedCopy: String(input.hasCertifiedCopy),
      ...(input.otherDescription ? { otherDescription: input.otherDescription } : {}),
    },
  });
}

export function resubmitRequest(requestId: number, file: PickedFile) {
  return apiUpload<{ message: string; request: CertificationRequest }>(
    `/api/certification/requests/${requestId}/resubmit`,
    { file },
  );
}

/** Cancel a request that has not been picked up yet, or remove a rejected one from the list. */
export function cancelRequest(requestId: number) {
  return apiRequest<{ message?: string } | null>(`/api/certification/requests/${requestId}`, { method: 'DELETE' });
}
