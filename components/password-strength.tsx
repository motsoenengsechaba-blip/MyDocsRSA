import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { checkPassword } from '@/lib/password';

const STRENGTH_COLOR = {
  'Too weak': colors.danger,
  Weak: '#D9622B',
  Fair: '#C98A1B',
  Strong: colors.success,
};

/** A strength meter and a live checklist of the password rules. Shows nothing until something is typed. */
export function PasswordStrength({ password, email, name }: { password: string; email?: string; name?: string }) {
  if (!password) return null;
  const check = checkPassword(password, { email, name });
  const color = STRENGTH_COLOR[check.strength];

  return (
    <View style={styles.wrap}>
      <View style={styles.meterRow}>
        <View style={styles.meter}>
          {check.rules.map((rule, i) => (
            <View key={rule.id} style={[styles.segment, { backgroundColor: i < check.score ? color : colors.border }]} />
          ))}
        </View>
        <Text style={[styles.strength, { color }]}>{check.strength}</Text>
      </View>

      <View style={styles.rules}>
        {check.rules.map((rule) => (
          <View key={rule.id} style={styles.rule}>
            <Ionicons
              name={rule.ok ? 'checkmark-circle' : 'ellipse-outline'}
              size={15}
              color={rule.ok ? colors.success : colors.faint}
            />
            <Text style={[styles.ruleText, rule.ok ? { color: colors.text } : null]}>{rule.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 8 },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meter: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 5, borderRadius: 3 },
  strength: { fontSize: 12, fontWeight: '800', minWidth: 62, textAlign: 'right' },
  rules: { gap: 5 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { fontSize: 12, color: colors.muted },
});
