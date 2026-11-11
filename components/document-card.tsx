import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RequestStatusBadge } from '@/components/badge';
import { DocIcon } from '@/components/doc-icon';
import { cardShadow, colors, radius } from '@/constants/colors';
import { formatDate } from '@/lib/format';
import { requestTitle, type CertificationRequest, type RequestStatus } from '@/lib/types';

type Props = {
  request: CertificationRequest;
  onPress: () => void;
  /** Shown as a download button on verified documents. */
  onDownload?: () => void;
};

const STEPS = ['Sent', 'In review', 'Verified'];

/** How far along the journey a request is (1-3), and whether it stopped on a problem. */
function progressFor(status: RequestStatus): { step: number; stalled: boolean } {
  switch (status) {
    case 'SUBMITTED':
      return { step: 1, stalled: false };
    case 'UNDER_REVIEW':
    case 'INVESTIGATION_REQUIRED':
      return { step: 2, stalled: false };
    case 'APPROVED':
      return { step: 3, stalled: false };
    case 'REJECTED':
    case 'RESUBMISSION_REQUIRED':
      return { step: 2, stalled: true };
  }
}

/** One document in a list: icon, name, date, status, and a three-step progress track until it is verified. */
export function DocumentCard({ request, onPress, onDownload }: Props) {
  const verified = request.status === 'APPROVED';
  const { step, stalled } = progressFor(request.status);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed ? { opacity: 0.88 } : null]}>
      <View style={styles.row}>
        <DocIcon type={request.documentType} />
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {requestTitle(request)}
          </Text>
          <Text style={styles.meta}>Submitted {formatDate(request.createdAt)}</Text>
        </View>
        {verified && onDownload ? (
          <Pressable onPress={onDownload} hitSlop={8} style={styles.download} accessibilityLabel="Download document">
            <Ionicons name="download-outline" size={20} color={colors.primary} />
          </Pressable>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      </View>

      <View style={styles.statusRow}>
        <RequestStatusBadge status={request.status} />
      </View>

      {request.status === 'REJECTED' || request.status === 'RESUBMISSION_REQUIRED' ? (
        <Text style={styles.reason} numberOfLines={2}>
          {request.status === 'REJECTED' ? 'Reason: ' : 'Needed: '}
          {request.notes?.trim() || 'No reason given. Tap for details.'}
        </Text>
      ) : null}

      {!verified ? (
        <View style={styles.track}>
          {STEPS.map((label, i) => {
            const reached = i + 1 <= step;
            const isStalledStep = stalled && i + 1 === step;
            const color = isStalledStep ? colors.danger : reached ? colors.primary : colors.border;
            return (
              <View key={label} style={styles.stepCol}>
                <View style={[styles.bar, { backgroundColor: color }]} />
                <Text style={[styles.stepLabel, reached ? { color: isStalledStep ? colors.danger : colors.text } : null]}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
    ...cardShadow,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  statusRow: { flexDirection: 'row' },
  download: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reason: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  track: { flexDirection: 'row', gap: 6, marginTop: 2 },
  stepCol: { flex: 1, gap: 5 },
  bar: { height: 5, borderRadius: 3 },
  stepLabel: { fontSize: 11, fontWeight: '600', color: colors.faint },
});
