import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/colors';

export type SelectOption<T extends string> = { value: T; label: string; hint?: string };

type Props<T extends string> = {
  label: string;
  options: SelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder: string;
  error?: string;
};

/** A dropdown: tap the field to open the list, tap an option to choose it. */
export function SelectField<T extends string>({ label, options, value, onChange, placeholder, error }: Props<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[styles.field, open ? styles.fieldOpen : null, error ? styles.fieldError : null]}>
        <Text style={[styles.value, !selected ? { color: colors.faint } : null]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>

      {open ? (
        <View style={styles.list}>
          {options.map((o, index) => {
            const on = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={[styles.option, index > 0 ? styles.optionBorder : null, on ? styles.optionOn : null]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, on ? { color: colors.primary } : null]}>{o.label}</Text>
                  {o.hint ? <Text style={styles.optionHint}>{o.hint}</Text> : null}
                </View>
                {on ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md - 2,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  fieldOpen: { borderColor: colors.primary, backgroundColor: '#FFFFFF' },
  fieldError: { borderColor: colors.danger },
  value: { fontSize: 16, color: colors.text },
  list: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  option: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  optionBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  optionOn: { backgroundColor: colors.cardTint },
  optionLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  optionHint: { fontSize: 12, color: colors.muted, marginTop: 1 },
  error: { color: colors.danger, fontSize: 13 },
});
