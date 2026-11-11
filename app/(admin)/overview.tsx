import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadError } from '@/components/load-error';
import { HeaderButton } from '@/components/page';
import { SegmentBar, STATUS_COLORS } from '@/components/segment-bar';
import { DotGrid, Rings } from '@/components/texture';
import type { IconName } from '@/components/ui-kit';
import { cardShadow, colors, radius } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminStats } from '@/lib/admin';
import { useLoad } from '@/lib/use-load';

const ROLE_COLORS = { users: '#1D4E89', officers: '#0B6B4F', admins: '#B8902F' };

type Attention = { key: string; icon: IconName; color: string; bg: string; title: string; detail: string; to: '/all-requests' | '/people' };

export default function AdminOverviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const stats = useLoad(fetchAdminStats, { intervalMs: 30000 });
  const data = stats.data;

  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const decided = data ? data.requests.approved + data.requests.rejected : 0;
  const rate = data && decided > 0 ? Math.round((data.requests.approved / decided) * 100) : null;
  const awaiting = data ? data.requests.waiting + data.requests.resubmissionRequired : undefined;

  // Things an admin may want to act on, most urgent first
  const attention: Attention[] = [];
  if (data) {
    const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
    if (data.requests.waiting > 0)
      attention.push({
        key: 'waiting',
        icon: 'hourglass-outline',
        color: STATUS_COLORS.pending,
        bg: colors.warnBg,
        title: `${plural(data.requests.waiting, 'request')} waiting for an officer`,
        detail: 'Nobody has picked these up yet',
        to: '/all-requests',
      });
    if (data.requests.resubmissionRequired > 0)
      attention.push({
        key: 'resubmit',
        icon: 'refresh-outline',
        color: STATUS_COLORS.resubmit,
        bg: '#FDE9DD',
        title: `${plural(data.requests.resubmissionRequired, 'applicant')} asked to resubmit`,
        detail: 'Waiting for corrected documents',
        to: '/all-requests',
      });
    if (data.users.inactive > 0)
      attention.push({
        key: 'inactive',
        icon: 'person-remove-outline',
        color: colors.danger,
        bg: colors.dangerBg,
        title: plural(data.users.inactive, 'inactive account'),
        detail: 'Signed out and unable to log in',
        to: '/people',
      });
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={stats.refreshing} onRefresh={stats.refresh} />}>
        {/* ---------- Hero ---------- */}
        <LinearGradient
          colors={[colors.navy, colors.navyMid, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          <DotGrid cols={14} rows={9} gap={20} style={{ right: 0, top: 40 }} opacity={0.22} />
          <Rings count={8} base={90} step={46} top={70} right={34} />

          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Command centre</Text>
              <Text style={styles.heroTitle}>Dashboard</Text>
              <Text style={styles.heroSub}>{firstName ? `Welcome back, ${firstName}` : 'System overview'}</Text>
            </View>
            <HeaderButton icon="person-circle-outline" label="Profile" onPress={() => router.push('/admin-account')} />
          </View>

          <View style={styles.rateRow}>
            <Text style={styles.rate}>{rate === null ? '—' : `${rate}%`}</Text>
            <Text style={styles.rateLabel}>verification{'\n'}rate</Text>
          </View>
          <View style={styles.rateTrack}>
            <View style={[styles.rateFill, { width: `${rate ?? 0}%` }]} />
          </View>
          <Text style={styles.rateHint}>
            {decided > 0 ? `${data?.requests.approved} verified out of ${decided} decided requests` : 'No decisions have been made yet'}
          </Text>
        </LinearGradient>

        {/* ---------- KPI strip overlapping the hero ---------- */}
        <View style={styles.strip}>
          <Kpi value={data?.requests.total} label="Requests" />
          <View style={styles.sep} />
          <Kpi value={awaiting} label="Awaiting action" color={awaiting ? STATUS_COLORS.pending : undefined} />
          <View style={styles.sep} />
          <Kpi value={data?.credentials.active} label="Active cards" color={colors.primary} />
        </View>

        <View style={styles.body}>
          {stats.loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
          ) : stats.error || !data ? (
            <LoadError state={stats} fallback="Could not load the statistics." />
          ) : (
            <>
              <Text style={styles.section}>Needs attention</Text>
              {attention.length === 0 ? (
                <View style={styles.clear}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.successBg }]}>
                    <Ionicons name="checkmark-done" size={20} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>All clear</Text>
                    <Text style={styles.rowDetail}>Nothing is waiting on you right now.</Text>
                  </View>
                </View>
              ) : (
                attention.map((a) => (
                  <Pressable key={a.key} onPress={() => router.push(a.to)} style={({ pressed }) => [styles.attention, pressed ? { opacity: 0.88 } : null]}>
                    <View style={[styles.stripe, { backgroundColor: a.color }]} />
                    <View style={[styles.rowIcon, { backgroundColor: a.bg }]}>
                      <Ionicons name={a.icon} size={20} color={a.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{a.title}</Text>
                      <Text style={styles.rowDetail}>{a.detail}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.faint} />
                  </Pressable>
                ))
              )}

              <Text style={styles.section}>Request pipeline</Text>
              <View style={styles.card}>
                <SegmentBar
                  segments={[
                    { label: 'Pending', value: data.requests.waiting, color: STATUS_COLORS.pending },
                    { label: 'In review', value: data.requests.underReview, color: STATUS_COLORS.review },
                    { label: 'Verified', value: data.requests.approved, color: STATUS_COLORS.verified },
                    { label: 'Rejected', value: data.requests.rejected, color: STATUS_COLORS.rejected },
                    { label: 'Resubmit', value: data.requests.resubmissionRequired, color: STATUS_COLORS.resubmit },
                  ]}
                />
              </View>

              <Text style={styles.section}>People</Text>
              <View style={styles.card}>
                <View style={styles.roster}>
                  <Roster icon="people-outline" value={data.users.users} label="Users" color={ROLE_COLORS.users} />
                  <Roster icon="shield-checkmark-outline" value={data.users.officers} label="Officers" color={ROLE_COLORS.officers} />
                  <Roster icon="key-outline" value={data.users.admins} label="Admins" color={ROLE_COLORS.admins} />
                </View>
                <SegmentBar
                  showLegend={false}
                  height={10}
                  segments={[
                    { label: 'Users', value: data.users.users, color: ROLE_COLORS.users },
                    { label: 'Officers', value: data.users.officers, color: ROLE_COLORS.officers },
                    { label: 'Admins', value: data.users.admins, color: ROLE_COLORS.admins },
                  ]}
                />
                {data.users.inactive > 0 ? (
                  <View style={styles.inactive}>
                    <Ionicons name="person-remove-outline" size={16} color={colors.danger} />
                    <Text style={styles.inactiveText}>
                      {data.users.inactive} inactive account{data.users.inactive === 1 ? '' : 's'}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.section}>Digital cards</Text>
              <LinearGradient colors={['#0A1F44', '#14527A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardsPanel}>
                <Rings count={6} base={70} step={40} top={28} right={28} color="rgba(255,255,255,0.12)" />
                <View style={styles.cardsTop}>
                  <View>
                    <Text style={styles.cardsLabel}>Issued in total</Text>
                    <Text style={styles.cardsTotal}>{data.credentials.total}</Text>
                  </View>
                  <View style={styles.seal}>
                    <Ionicons name="shield-checkmark" size={24} color={colors.gold} />
                  </View>
                </View>
                <SegmentBar
                  tone="dark"
                  segments={[
                    { label: 'Active', value: data.credentials.active, color: '#34D399' },
                    { label: 'Expired', value: data.credentials.expired, color: '#F5B94A' },
                    { label: 'Revoked', value: data.credentials.revoked, color: '#F87171' },
                  ]}
                />
              </LinearGradient>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Kpi({ value, label, color }: { value: number | undefined; label: string; color?: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={[styles.kpiValue, color ? { color } : null]}>{value ?? '—'}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function Roster({ icon, value, label, color }: { icon: IconName; value: number; label: string; color: string }) {
  return (
    <View style={styles.rosterCol}>
      <View style={[styles.rosterIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.rosterValue}>{value}</Text>
      <Text style={styles.rosterLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },

  hero: { paddingHorizontal: 22, paddingBottom: 66, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eyebrow: { color: colors.gold, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  heroTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 2 },
  rateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 26 },
  rate: { color: '#FFFFFF', fontSize: 58, lineHeight: 62, fontWeight: '800', letterSpacing: -2 },
  rateLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 18, paddingBottom: 8 },
  rateTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.16)', marginTop: 10, overflow: 'hidden' },
  rateFill: { height: 6, borderRadius: 3, backgroundColor: colors.gold },
  rateHint: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 8 },

  strip: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -36,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: 16,
    ...cardShadow,
  },
  kpi: { flex: 1, alignItems: 'center', gap: 2 },
  kpiValue: { fontSize: 26, fontWeight: '800', color: colors.text },
  kpiLabel: { fontSize: 12, color: colors.muted },
  sep: { width: 1, backgroundColor: colors.border, marginVertical: 4 },

  body: { paddingHorizontal: 20, paddingTop: 22, gap: 12 },
  section: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 16,
    ...cardShadow,
  },

  attention: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 18,
    overflow: 'hidden',
    ...cardShadow,
  },
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  clear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    ...cardShadow,
  },
  rowIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowDetail: { fontSize: 12, color: colors.muted, marginTop: 1 },

  roster: { flexDirection: 'row' },
  rosterCol: { flex: 1, alignItems: 'center', gap: 4 },
  rosterIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  rosterValue: { fontSize: 26, fontWeight: '800', color: colors.text },
  rosterLabel: { fontSize: 12, color: colors.muted },
  inactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.dangerBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inactiveText: { fontSize: 12, fontWeight: '700', color: colors.danger },

  cardsPanel: { borderRadius: radius.lg, padding: 20, gap: 22, overflow: 'hidden', boxShadow: '0 12px 26px rgba(10,31,68,0.22)', elevation: 5 },
  cardsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  cardsTotal: { color: '#FFFFFF', fontSize: 44, lineHeight: 50, fontWeight: '800', letterSpacing: -1 },
  seal: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
