import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { Page } from '@/components/page';
import { Banner, Button, Field } from '@/components/ui-kit';
import { DocumentViewer } from '@/components/document-viewer';
import { RequestStatusBadge } from '@/components/badge';
import { requestTitle } from '@/lib/types';
import { ApiError } from '@/lib/api';
import { fetchOfficerQueue, startReview, approveRequest, rejectRequest, requestResubmission } from '@/lib/officer';
import { useLoad } from '@/lib/use-load';

export default function ReviewDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queue = useLoad(fetchOfficerQueue, { intervalMs: 15000 });
  const request = [...(queue.data?.pending ?? []), ...(queue.data?.inReview ?? [])].find((r) => r.requestId === Number(id));
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function act(action: 'review' | 'approve' | 'reject' | 'more') {
    if (!request || busy) return;
    setError(''); setMessage('');
    if ((action === 'reject' || action === 'more') && !reason.trim()) { setError('Enter a reason that the applicant will see.'); return; }
    setBusy(true);
    try {
      if (action === 'review') await startReview(request.requestId);
      if (action === 'approve') await approveRequest(request.requestId);
      if (action === 'reject') await rejectRequest(request.requestId, reason.trim());
      if (action === 'more') await requestResubmission(request.requestId, reason.trim());
      setMessage(action === 'review' ? 'Review started.' : 'Decision saved. The applicant can see the updated status.');
      await queue.refresh();
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not save the decision.'); }
    finally { setBusy(false); }
  }
  return <Page title="Review request" back refreshing={queue.refreshing} onRefresh={queue.refresh}>
    {queue.loading ? <ActivityIndicator /> : null}
    {queue.error || error ? <Banner message={error || queue.error} /> : null}
    {message ? <Banner message={message} kind="success" /> : null}
    {request ? <>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>{requestTitle(request)}</Text>
      <Text>Applicant: {request.applicantName}</Text>
      <RequestStatusBadge status={request.status} />
      <Text>{request.hasCertifiedCopy ? 'Certified copy supplied' : 'Original document: investigation required'}</Text>
      <DocumentViewer key={request.documentId} documentId={request.documentId} fileName={request.originalFileName} />
      {request.status === 'SUBMITTED' || request.status === 'INVESTIGATION_REQUIRED' ? <Button title="Start review" onPress={() => act('review')} loading={busy} /> : <>
        <Field label="Reason for rejection or corrected copy" value={reason} onChangeText={setReason} multiline maxLength={255} editable={!busy} />
        <Button title="Approve and issue credential" variant="success" onPress={() => act('approve')} disabled={busy} />
        <Button title="Request corrected copy" variant="secondary" onPress={() => act('more')} disabled={busy} />
        <Button title="Reject request" variant="danger" onPress={() => act('reject')} disabled={busy} />
      </>}
    </> : !queue.loading && !queue.error && !message ? <Banner message="This request is no longer in the review queue." kind="info" /> : null}
  </Page>;
}
