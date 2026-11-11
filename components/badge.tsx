import { Pill, type PillTone } from '@/components/pill';
import type { CredentialStatus, RequestStatus } from '@/lib/types';

const REQUEST: Record<RequestStatus, { label: string; tone: PillTone }> = {
  SUBMITTED: { label: 'Pending', tone: 'warn' },
  UNDER_REVIEW: { label: 'In review', tone: 'info' },
  INVESTIGATION_REQUIRED: { label: 'In review', tone: 'info' },
  APPROVED: { label: 'Verified', tone: 'good' },
  REJECTED: { label: 'Rejected', tone: 'bad' },
  RESUBMISSION_REQUIRED: { label: 'Action needed', tone: 'bad' },
};

const CREDENTIAL: Record<CredentialStatus, { label: string; tone: PillTone }> = {
  ACTIVE: { label: 'Verified', tone: 'good' },
  EXPIRED: { label: 'Expired', tone: 'warn' },
  REVOKED: { label: 'Revoked', tone: 'bad' },
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const s = REQUEST[status];
  return <Pill label={s.label} tone={s.tone} />;
}

export function CredentialStatusBadge({ status }: { status: CredentialStatus }) {
  const s = CREDENTIAL[status];
  return <Pill label={s.label} tone={s.tone} />;
}
