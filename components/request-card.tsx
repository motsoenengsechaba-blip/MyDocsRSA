import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RequestStatusBadge } from '@/components/badge';
import { DocIcon } from '@/components/doc-icon';
import { ReasonCard } from '@/components/reason-card';
import { Banner, Button } from '@/components/ui-kit';
import { cardShadow, colors, radius } from '@/constants/colors';
import { formatDate } from '@/lib/format';
import { requestTitle, type CertificationRequest, type RequestStatus } from '@/lib/types';
import { useCancel } from '@/lib/use-cancel';
import { useResubmit } from '@/lib/use-resubmit';

// 0 = submitted, 1 = being reviewed, 2 = decision made
function progressStep(status: RequestStatus): number {
  if (status === 'SUBMITTED') return 0;
  if (status === 'UNDER_REVIEW' || status === 'INVESTIGATION_REQUIRED') return 1;
  return 2;
}

const STEP_LABELS = ['Submitted', 'In review', 'Decision'];

type Props = {
  request: CertificationRequest;
  onPress: () => void; // open the document detail
  onChanged: () => void; // reload the list after a resubmission
};

export function RequestCard({ request, onPress, onChanged }: Props) {
  const resubmit = useResubmit(request.requestId, onChanged);
  const cancel = useCancel(request, onChanged);
  const step = progressStep(request.status);
  const failed = request.status === 'REJECTED' || request.status === 'RESUBMISSION_REQUIRED';

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} style={styles.top}>
        <DocIcon type={request.documentType} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {requestTitle(request)}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {formatDate(request.createdAt)} ·{' '}
            {request.processingPath === 'FAST_TRACK_CERTIFIED_COPY' ? 'Fast track' : 'Full investigation'}
          </Text>
        </View>
        <RequestStatusBadge status={request.status} />
      </Pressable>

      <View style={styles.progress}>
        {STEP_LABELS.map((label, index) => {
          const reached = index <= step;
          const isLast = index === 2;
          const color = !reached
            ? colors.border
            : isLast && failed
              ? colors.danger
              : isLast && request.status === 'APPROVED'
                ? colors.success
                : colors.primary;
          return (
            <View key={label} style={styles.progressItem}>
              <View style={styles.dotRow}>
                <View style={[styles.line, index === 0 ? { backgroundColor: 'transparent' } : { backgroundColor: color }]} />
                <View style={[styles.dot, { backgroundColor: color }]}>
                  {reached ? <Ionicons name={isLast && failed ? 'close' : 'checkmark'} size={10} color="#FFFFFF" /> : null}
                </View>
                <View style={[styles.line, index === 2 ? { backgroundColor: 'transparent' } : { backgroundColor: index < step ? color : colors.border }]} />
              </View>
              <Text style={[styles.progressLabel, reached ? styles.progressLabelOn : null]}>{label}</Text>
            </View>
          );
        })}
      </View>

      {request.status === 'APPROVED' ? (
        <Banner kind="success" message="Verified. Your digital card is ready in My Documents." />
      ) : null}
      {failed ? <ReasonCard request={request} compact /> : null}

      {request.status === 'RESUBMISSION_REQUIRED' ? (
        <>
          {resubmit.error ? <Banner message={resubmit.error} /> : null}
          <Button title="Upload corrected document" icon="cloud-upload-outline" onPress={resubmit.start} loading={resubmit.busy} />
        </>
      ) : null}

      {cancel.error ? <Banner message={cancel.error} /> : null}
      {cancel.kind ? (
        <Pressable onPress={cancel.start} disabled={cancel.busy} style={styles.cancel}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={styles.cancelText}>{cancel.busy ? 'Working...' : cancel.label}</Text>
        </Pressable>
      ) : request.status === 'UNDER_REVIEW' || request.status === 'INVESTIGATION_REQUIRED' ? (
        <Text style={styles.locked}>An officer is already reviewing this, so it can no longer be cancelled.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    gap: 12,
    ...cardShadow,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  progress: { flexDirection: 'row' },
  progressItem: { alignItems: 'center', flex: 1, gap: 5 },
  dotRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  line: { flex: 1, height: 3 },
  dot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  progressLabel: { fontSize: 11, color: colors.muted },
  progressLabelOn: { color: colors.text, fontWeight: '700' },
  cancel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  cancelText: { fontSize: 13, fontWeight: '700', color: colors.danger },
  locked: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
