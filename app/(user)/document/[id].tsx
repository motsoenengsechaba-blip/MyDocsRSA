import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import { Page } from '@/components/page';
import { Banner, Button } from '@/components/ui-kit';
import { RequestStatusBadge } from '@/components/badge';
import { DocumentViewer } from '@/components/document-viewer';
import { ReasonCard } from '@/components/reason-card';
import { fetchMyRequests } from '@/lib/certification';
import { requestTitle, type CertificationRequest } from '@/lib/types';
import { useLoad } from '@/lib/use-load';
import { useCancel } from '@/lib/use-cancel';
import { useResubmit } from '@/lib/use-resubmit';
import { formatDate } from '@/lib/format';

function Details({ request, refresh }: { request: CertificationRequest; refresh: () => void }) {
  const router = useRouter();
  const cancel = useCancel(request, () => router.replace('/requests'));
  const resubmit = useResubmit(request.requestId, refresh);
  return <>
    <Text style={{ fontSize: 22, fontWeight: '700' }}>{requestTitle(request)}</Text>
    <RequestStatusBadge status={request.status} />
    <Text>Submitted: {formatDate(request.createdAt)}</Text>
    {request.updatedAt ? <Text>Last updated: {formatDate(request.updatedAt)}</Text> : null}
    {request.reviewedByName ? <Text>Officer: {request.reviewedByName}</Text> : null}
    {request.status === 'REJECTED' || request.status === 'RESUBMISSION_REQUIRED' ? <ReasonCard request={request} /> : null}
    <DocumentViewer key={request.documentId} documentId={request.documentId} fileName={request.originalFileName} />
    {cancel.error || resubmit.error ? <Banner message={cancel.error || resubmit.error} /> : null}
    {request.status === 'RESUBMISSION_REQUIRED' ? <Button title="Upload corrected document" onPress={resubmit.start} loading={resubmit.busy} disabled={cancel.busy} /> : null}
    {cancel.kind ? <Button title={cancel.label} variant="danger" onPress={cancel.start} loading={cancel.busy} disabled={resubmit.busy} /> : null}
  </>;
}

export default function DocumentDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const list = useLoad(fetchMyRequests, { intervalMs: 15000 });
  const request = list.data?.find((r) => r.requestId === Number(id));
  return <Page title="Request details" back refreshing={list.refreshing} onRefresh={list.refresh}>
    {list.loading ? <ActivityIndicator /> : null}
    {list.error ? <Banner message={list.error} /> : null}
    {request ? <Details request={request} refresh={list.refresh} /> : !list.loading && !list.error ? <Banner message="This request is no longer available." kind="info" /> : null}
  </Page>;
}
