import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pill } from '@/components/pill';
import { Button, type IconName } from '@/components/ui-kit';
import { cardShadow, colors, radius } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

function initials(name: string | undefined) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Profile screen shared by all three roles: navy header with the avatar, then the account details. */
export function AccountPanel({ roleLabel }: { roleLabel: string }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.navy, colors.navyMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 18 }]}>
        <Text style={styles.headerTitle}>My profile</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={{ marginTop: 6 }}>
          <Pill label={roleLabel} tone="info" />
        </View>
        <View style={styles.goldLine} />
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <InfoRow icon="person-outline" label="Full name" value={user?.fullName ?? ''} />
          <InfoRow icon="mail-outline" label="Email" value={user?.email ?? ''} />
          <InfoRow icon="shield-checkmark-outline" label="Account type" value={roleLabel} last />
        </View>

        <Button title="Sign out" variant="danger" icon="log-out-outline" onPress={logout} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, last }: { icon: IconName; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last ? { borderBottomWidth: 0 } : null]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 28,
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 4,
  },
  headerTitle: { alignSelf: 'flex-start', color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 14 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText: { color: colors.navy, fontSize: 30, fontWeight: '800' },
  name: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  email: { color: 'rgba(255,255,255,0.78)', fontSize: 14 },
  goldLine: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: colors.gold, opacity: 0.85 },
  scroll: {},
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    ...cardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 12, color: colors.muted },
  rowValue: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 1 },
});
