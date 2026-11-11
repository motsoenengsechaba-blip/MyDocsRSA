import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DotGrid, Rings } from '@/components/texture';
import type { IconName } from '@/components/ui-kit';
import { colors } from '@/constants/colors';

type Props = {
  title: string;
  subtitle?: string;
  /** Show a back arrow in the header. */
  back?: boolean;
  /** Something to show on the right of the header, e.g. a <HeaderButton />. */
  right?: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** A floating "pill" button in the bottom-right corner (plus icon and label). */
  fab?: { label: string; onPress: () => void };
};

/**
 * Standard screen: a navy gradient header (title, optional back arrow and action), then a
 * scrolling content area on a light background. Pull down to refresh when onRefresh is given.
 */
export function Page({ title, subtitle, back, right, children, refreshing = false, onRefresh, fab }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[colors.navy, colors.navyMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <DotGrid cols={10} rows={6} gap={16} style={{ right: 6, bottom: 8 }} />
        <Rings count={5} base={64} step={34} top={8} right={36} color="rgba(201,162,75,0.16)" />
        <View style={styles.headerRow}>
          {back ? (
            <Pressable
              onPress={() => {
                if (router.canGoBack()) router.back();
              }}
              hitSlop={12}
              style={styles.roundButton}
              accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </Pressable>
          ) : null}
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {right}
        </View>
        <View style={styles.goldLine} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, fab ? { paddingBottom: 110 } : null]}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}>
        {children}
      </ScrollView>

      {fab ? (
        <Pressable
          onPress={fab.onPress}
          style={({ pressed }) => [styles.fab, pressed ? { opacity: 0.88, transform: [{ scale: 0.98 }] } : null]}
          accessibilityRole="button"
          accessibilityLabel={fab.label}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.fabLabel}>{fab.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** A small round icon button for the header's right side. */
export function HeaderButton({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.roundButton} accessibilityLabel={label}>
      <Ionicons name={icon} size={22} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 14, marginTop: 3 },
  goldLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: colors.gold,
    opacity: 0.85,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 20,
    borderRadius: 999,
    backgroundColor: colors.primary,
    boxShadow: '0 10px 22px rgba(11, 107, 79, 0.4)',
    elevation: 6,
  },
  fabLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
