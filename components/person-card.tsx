import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/pill';
import { Banner } from '@/components/ui-kit';
import { cardShadow, colors, radius } from '@/constants/colors';
import { changeUserRole, setUserActive, type AdminUser } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import { formatDate } from '@/lib/format';

type Action = 'role' | 'active';

const ROLE_LABELS: Record<string, string> = { USER: 'User', POLICE_OFFICER: 'Officer', ADMIN: 'Admin' };
const ROLE_COLORS: Record<string, string> = { USER: '#1D4ED8', POLICE_OFFICER: '#0F766E', ADMIN: '#7C3AED' };

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

type Props = {
  person: AdminUser;
  onChanged: () => void; // reload the list after a change
};

/** One account with its details and the admin actions (with an inline confirm step). */
export function PersonCard({ person, onChanged }: Props) {
  const [confirm, setConfirm] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isOfficer = person.role === 'POLICE_OFFICER';
  const isAdmin = person.role === 'ADMIN';
  const accent = ROLE_COLORS[person.role] ?? colors.primary;

  function confirmText(action: Action) {
    if (action === 'role') {
      return isOfficer
        ? `${person.fullName} will lose access to the review queue and become a normal user.`
        : `${person.fullName} will be able to review documents and approve or reject requests.`;
    }
    return person.active
      ? `${person.fullName} will be signed out and unable to log in.`
      : `${person.fullName} will be able to log in again.`;
  }

  async function run() {
    if (!confirm) return;
    setError('');
    setBusy(true);
    try {
      if (confirm === 'role') {
        await changeUserRole(person.id, isOfficer ? 'USER' : 'POLICE_OFFICER');
      } else {
        await setUserActive(person.id, !person.active);
      }
      setConfirm(null);
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={[styles.edge, { backgroundColor: person.active ? accent : colors.faint }]} />
      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: `${accent}1A`, borderWidth: 2, borderColor: `${accent}55` }]}>
          <Text style={[styles.avatarText, { color: accent }]}>{initials(person.fullName)}</Text>
          <View style={[styles.statusDot, { backgroundColor: person.active ? '#22C55E' : colors.faint }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {person.fullName}
          </Text>
          <Text style={styles.detail} numberOfLines={1}>
            {person.email}
          </Text>
        </View>
        <View style={{ gap: 4, alignItems: 'flex-end' }}>
          <Pill label={ROLE_LABELS[person.role] ?? person.role} tone={isAdmin ? 'info' : isOfficer ? 'good' : 'neutral'} />
          {!person.active ? <Pill label="Inactive" tone="bad" /> : null}
        </View>
      </View>

      {person.phoneNumber ? <Text style={styles.meta}>{person.phoneNumber}</Text> : null}
      <Text style={styles.meta}>
        Joined {formatDate(person.createdAt)}
        {isOfficer
          ? ` · ${person.reviewedCount} decision${person.reviewedCount === 1 ? '' : 's'} made`
          : !isAdmin
            ? ` · ${person.requestCount} request${person.requestCount === 1 ? '' : 's'}`
            : ''}
      </Text>

      {isAdmin ? (
        <Text style={styles.meta}>Admin accounts can only be managed in the database.</Text>
      ) : confirm ? (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmText}>{confirmText(confirm)}</Text>
          {error ? <Banner message={error} /> : null}
          <View style={styles.row}>
            <Pressable onPress={run} disabled={busy} style={[styles.btn, styles.btnPrimary, busy ? { opacity: 0.6 } : null]}>
              <Text style={styles.btnPrimaryText}>{busy ? 'Working…' : 'Confirm'}</Text>
            </Pressable>
            <Pressable onPress={() => setConfirm(null)} disabled={busy} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          <Pressable
            onPress={() => {
              setError('');
              setConfirm('role');
            }}
            style={[styles.btn, styles.btnGhost]}>
            <Text style={styles.btnGhostText}>{isOfficer ? 'Remove officer role' : 'Make officer'}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setError('');
              setConfirm('active');
            }}
            style={[styles.btn, person.active ? styles.btnDanger : styles.btnGhost]}>
            <Text style={person.active ? styles.btnDangerText : styles.btnGhostText}>
              {person.active ? 'Deactivate' : 'Activate'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 19,
    gap: 4,
    overflow: 'hidden',
    ...cardShadow,
  },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  statusDot: { position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#FFFFFF' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  detail: { fontSize: 13, color: colors.muted },
  meta: { fontSize: 12, color: colors.muted },
  row: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.sm },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: colors.primaryText, fontWeight: '700', fontSize: 13 },
  btnGhost: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  btnGhostText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  btnDanger: { backgroundColor: colors.dangerBg },
  btnDangerText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  confirmBox: { marginTop: 10, gap: 6 },
  confirmText: { fontSize: 14, color: colors.text, lineHeight: 20 },
});
