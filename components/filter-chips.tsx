import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { cardShadow, colors } from '@/constants/colors';

export type Chip<T extends string> = { value: T; label: string; count?: number };

type Props<T extends string> = {
  chips: Chip<T>[];
  selected: T;
  onSelect: (value: T) => void;
};

/** A segmented tab bar in a white card, e.g. All / Pending / Verified / Rejected. Scrolls sideways if it has many tabs. */
export function FilterChips<T extends string>({ chips, selected, onSelect }: Props<T>) {
  return (
    <View style={styles.bar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {chips.map((chip) => {
          const on = chip.value === selected;
          return (
            <Pressable key={chip.value} onPress={() => onSelect(chip.value)} style={[styles.chip, on ? styles.chipOn : null]}>
              <Text style={[styles.text, on ? styles.textOn : null]}>{chip.label}</Text>
              {chip.count !== undefined ? (
                <View style={[styles.count, on ? styles.countOn : null]}>
                  <Text style={[styles.countText, on ? { color: '#FFFFFF' } : null]}>{chip.count}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.card, borderRadius: 999, padding: 5, ...cardShadow },
  row: { gap: 4, flexGrow: 1 },
  chip: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  chipOn: { backgroundColor: colors.primary },
  text: { fontSize: 13, color: colors.muted, fontWeight: '700' },
  textOn: { color: '#FFFFFF' },
  count: { minWidth: 20, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center' },
  countOn: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countText: { fontSize: 11, fontWeight: '800', color: colors.primary },
});
