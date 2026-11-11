import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

export type PillTone = 'neutral' | 'good' | 'warn' | 'bad' | 'info';

const TONES: Record<PillTone, { bg: string; fg: string }> = {
  neutral: { bg: '#ECEFEE', fg: '#3A4553' },
  good: { bg: colors.successBg, fg: colors.success },
  warn: { bg: colors.warnBg, fg: colors.warn },
  bad: { bg: colors.dangerBg, fg: colors.danger },
  info: { bg: colors.infoBg, fg: colors.info },
};

/** A small rounded status label, e.g. "Verified" (green), "Pending" (orange), "Rejected" (red). */
export function Pill({ label, tone = 'neutral' }: { label: string; tone?: PillTone }) {
  const t = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '700' },
});
