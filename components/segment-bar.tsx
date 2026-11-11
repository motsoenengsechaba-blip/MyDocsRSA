import { StyleSheet, Text, View } from 'react-native';

import { cardShadow, colors, radius } from '@/constants/colors';

export type Segment = { label: string; value: number; color: string };

/** Colours used for request statuses across the admin screens. */
export const STATUS_COLORS = {
  pending: '#C98A1B',
  review: '#1D4E89',
  verified: '#0B6B4F',
  rejected: '#B42318',
  resubmit: '#D9622B',
};

type Props = {
  segments: Segment[];
  showLegend?: boolean;
  /** 'dark' = for use on the navy cards (light legend text). */
  tone?: 'light' | 'dark';
  height?: number;
};

/** One stacked bar showing how a total splits into parts, with an optional legend (dot, label, count, percent). */
export function SegmentBar({ segments, showLegend = true, tone = 'light', height = 14 }: Props) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const visible = segments.filter((s) => s.value > 0);
  const dark = tone === 'dark';

  return (
    <View style={{ gap: 14 }}>
      <View style={[styles.bar, { height, borderRadius: height / 2, backgroundColor: dark ? 'rgba(255,255,255,0.12)' : '#E9EDEB' }]}>
        {visible.map((s) => (
          <View key={s.label} style={{ flex: s.value, backgroundColor: s.color, borderRadius: height / 2, minWidth: 8 }} />
        ))}
      </View>

      {showLegend ? (
        <View style={styles.legend}>
          {segments.map((s) => {
            const percent = total > 0 ? Math.round((s.value / total) * 100) : 0;
            return (
              <View key={s.label} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: s.color }]} />
                <Text style={[styles.legendLabel, dark ? { color: 'rgba(255,255,255,0.78)' } : null]} numberOfLines={1}>
                  {s.label}
                </Text>
                <Text style={[styles.legendValue, dark ? { color: '#FFFFFF' } : null]}>{s.value}</Text>
                <Text style={[styles.legendPercent, dark ? { color: 'rgba(255,255,255,0.55)' } : null]}>{percent}%</Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** A white card with a small title and a SegmentBar: the "at a glance" strip at the top of the admin lists. */
export function InsightCard({ title, segments }: { title: string; segments: Segment[] }) {
  return (
    <View style={styles.insight}>
      <Text style={styles.insightTitle}>{title}</Text>
      <SegmentBar segments={segments} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 3, overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexBasis: '46%', flexGrow: 1 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 13, color: colors.muted },
  legendValue: { fontSize: 13, fontWeight: '800', color: colors.text },
  legendPercent: { fontSize: 11, color: colors.faint, width: 32, textAlign: 'right' },
  insight: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    ...cardShadow,
  },
  insightTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
});
