import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { CredentialStatusBadge } from '@/components/badge';
import { DOC_GRADIENTS, DOC_ICONS } from '@/components/doc-icon';
import { FilterChips, type Chip } from '@/components/filter-chips';
import { LoadError } from '@/components/load-error';
import { Page } from '@/components/page';
import { InsightCard } from '@/components/segment-bar';
import { cardShadow, colors, radius } from '@/constants/colors';
import { fetchAdminCredentials, type AdminCredential } from '@/lib/admin';
import { formatDate } from '@/lib/format';
import { documentTypeLabel, type CredentialStatus } from '@/lib/types';
import { useLoad } from '@/lib/use-load';

type Filter = 'ALL' | CredentialStatus;

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

export default function AllCredentialsScreen() {
  const credentials = useLoad(fetchAdminCredentials);
  const [filter, setFilter] = useState<Filter>('ALL');

  const all = credentials.data ?? [];
  const count = (s: CredentialStatus) => all.filter((c) => c.status === s).length;
  const chips: Chip<Filter>[] = [
    { value: 'ALL', label: 'All', count: all.length },
    { value: 'ACTIVE', label: 'Active', count: count('ACTIVE') },
    { value: 'EXPIRED', label: 'Expired', count: count('EXPIRED') },
    { value: 'REVOKED', label: 'Revoked', count: count('REVOKED') },
  ];
  const shown = filter === 'ALL' ? all : all.filter((c) => c.status === filter);

  return (
    <Page title="Digital Cards" subtitle="Every credential issued to users" refreshing={credentials.refreshing} onRefresh={credentials.refresh}>
      <InsightCard
        title="Card status"
        segments={[
          { label: 'Active', value: count('ACTIVE'), color: '#0B6B4F' },
          { label: 'Expired', value: count('EXPIRED'), color: '#C98A1B' },
          { label: 'Revoked', value: count('REVOKED'), color: '#B42318' },
        ]}
      />
      <FilterChips chips={chips} selected={filter} onSelect={setFilter} />

      {credentials.loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : credentials.error ? (
        <LoadError state={credentials} />
      ) : shown.length === 0 ? (
        <Text style={styles.empty}>No cards match this filter.</Text>
      ) : (
        shown.map((c) => <CredentialTicket key={c.credentialId} credential={c} />)
      )}
    </Page>
  );
}

/** A card shown like a ticket: a coloured band for the document type on the left, details on the right, the code on a dashed stub. */
function CredentialTicket({ credential }: { credential: AdminCredential }) {
  const active = credential.status === 'ACTIVE';
  const gradient: [string, string] = active ? DOC_GRADIENTS[credential.documentType] ?? DOC_GRADIENTS.OTHER : ['#2F3A44', '#6B7782'];

  return (
    <View style={styles.ticket}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.band}>
        <Ionicons name={DOC_ICONS[credential.documentType] ?? 'document-text-outline'} size={26} color="#FFFFFF" />
      </LinearGradient>

      <View style={styles.main}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={1}>
            {credential.holderName}
          </Text>
          <CredentialStatusBadge status={credential.status} />
        </View>
        <Text style={styles.type}>{documentTypeLabel(credential.documentType, credential.otherDescription)}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {credential.holderEmail}
        </Text>
        <Text style={styles.meta}>
          Issued {formatDate(credential.issuedAt)} · Valid until {formatDate(credential.validUntil)}
        </Text>

        <View style={styles.stub}>
          <Ionicons name="qr-code-outline" size={14} color={colors.muted} />
          <Text style={styles.code} selectable numberOfLines={1}>
            {credential.verificationCode}
          </Text>
        </View>

        {credential.status === 'REVOKED' && credential.revocationReason ? (
          <Text style={styles.revoked}>Revoked: {credential.revocationReason}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 20 },
  ticket: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  band: { width: 62, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1, padding: 14, gap: 2 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, flexShrink: 1 },
  type: { fontSize: 14, color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  stub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: colors.border,
  },
  code: { flex: 1, fontSize: 11, color: colors.muted, fontFamily: MONO },
  revoked: { fontSize: 13, color: colors.danger, marginTop: 6 },
});
