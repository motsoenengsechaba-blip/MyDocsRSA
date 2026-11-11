import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RequestStatusBadge } from '@/components/badge';
import { DocIcon } from '@/components/doc-icon';
import { STATUS_COLORS } from '@/components/segment-bar';
import { cardShadow, colors, radius } from '@/constants/colors';
import { formatDate } from '@/lib/format';
import { requestTitle, type CertificationRequest, type RequestStatus } from '@/lib/types';

type Props = {
  request: CertificationRequest;
  onPress?: () => void;
  /** Extra grey lines under the main details (e.g. who handled it). */
  lines?: string[];
  /** A highlighted note, e.g. the officer's reason for a rejection. */
  note?: string;
};

function statusColor(status: RequestStatus): string {
  switch (status) {
    case 'APPROVED':
      return STATUS_COLORS.verified;
    case 'REJECTED':
      return STATUS_COLORS.rejected;
    case 'RESUBMISSION_REQUIRED':
      return STATUS_COLORS.resubmit;
    case 'UNDER_REVIEW':
    case 'INVESTIGATION_REQUIRED':
      return STATUS_COLORS.review;
    default:
      return STATUS_COLORS.pending;
  }
}

/** A request as seen by officers and admins: applicant, document, status and details. */
export function RequestRow({ request, onPress, lines = [], note }: Props) {
  const fastTrack = request.processingPath === 'FAST_TRACK_CERTIFIED_COPY';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed ? { opacity: 0.85 } : null]}>
      <View style={[styles.stripe, { backgroundColor: statusColor(request.status) }]} />
      <DocIcon type={request.documentType} />
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={1}>
            {request.applicantName ?? 'Applicant'}
          </Text>
          <RequestStatusBadge status={request.status} />
        </View>
        <Text style={styles.type}>{requestTitle(request)}</Text>
        <Text style={styles.meta}>
          Submitted {formatDate(request.createdAt)} · {fastTrack ? 'Fast track' : 'Full investigation'} · #{request.requestId}
        </Text>
        {lines.map((line) => (
          <Text key={line} style={styles.meta}>
            {line}
          </Text>
        ))}
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.faint} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 19,
    overflow: 'hidden',
    ...cardShadow,
  },
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  body: { flex: 1, gap: 2 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, flexShrink: 1 },
  type: { fontSize: 14, color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  note: { fontSize: 13, color: colors.danger, marginTop: 4 },
});
