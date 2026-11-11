import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/components/ui-kit';
import { colors, radius } from '@/constants/colors';

type Tone = 'default' | 'good' | 'warn' | 'bad';

const TONES: Record<Tone, { fg: string; bg: string; border: string }> = {
  default: { fg: colors.info, bg: '#E8F0FA', border: '#C9DAF0' },
  good: { fg: colors.success, bg: '#E3F4EC', border: '#B7E2CF' },
  warn: { fg: colors.warn, bg: '#FBF0D0', border: '#EBD49A' },
  bad: { fg: colors.danger, bg: '#FDE8E6', border: '#F2B7AF' },
};

/** A pastel tile: icon, big number, small label (like the dashboard tiles). */
export function StatCard({ label, value, icon, tone = 'default' }: { label: string; value: number | string; icon: IconName; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <View style={[styles.card, { backgroundColor: t.bg, borderColor: t.border }]}>
      <View style={styles.iconTile}>
        <Ionicons name={icon} size={19} color={t.fg} />
      </View>
      <Text style={[styles.value, { color: t.fg }]}>{value}</Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

/** Lays stat cards out two per row. */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
    gap: 2,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: { fontSize: 28, fontWeight: '800' },
  label: { fontSize: 12, color: colors.muted, fontWeight: '600' },
});
