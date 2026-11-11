import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/colors';
import { formatDate } from '@/lib/format';
import type { CertificationRequest } from '@/lib/types';

/**
 * Shows the officer's reason when a request was rejected or sent back, so the person always sees
 * what went wrong and what to do next. Use `compact` inside lists.
 */
export function ReasonCard({ request, compact }: { request: CertificationRequest; compact?: boolean }) {
  const sentBack = request.status === 'RESUBMISSION_REQUIRED';
  const title = sentBack ? 'What the officer needs' : 'Why this was rejected';
  const fallback = sentBack
    ? 'The officer asked for a new copy but did not leave a note.'
    : 'The officer did not leave a reason. You can submit a new request.';
  const by = request.reviewedByName
    ? `${request.reviewedByName}${request.reviewedAt ? ` · ${formatDate(request.reviewedAt)}` : ''}`
    : null;

  return (
    <View style={[styles.card, compact ? styles.cardCompact : null]}>
      <View style={styles.stripe} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Ionicons name={sentBack ? 'refresh-circle' : 'alert-circle'} size={compact ? 16 : 18} color={colors.danger} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={[styles.text, compact ? { fontSize: 13 } : null]}>{request.notes?.trim() || fallback}</Text>
        {by ? <Text style={styles.by}>{by}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  cardCompact: { borderRadius: radius.sm },
  stripe: { width: 5, backgroundColor: colors.danger },
  body: { flex: 1, padding: 14, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 14, fontWeight: '800', color: colors.danger },
  text: { fontSize: 15, lineHeight: 21, color: colors.text },
  by: { fontSize: 12, color: colors.muted },
});
