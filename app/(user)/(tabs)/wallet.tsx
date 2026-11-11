import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CredentialCard } from '@/components/credential-card';
import { DocumentCard } from '@/components/document-card';
import { LoadError } from '@/components/load-error';
import { HeaderButton, Page } from '@/components/page';
import { Banner, Button, textStyles, type IconName } from '@/components/ui-kit';
import { cardShadow, colors, radius } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { fetchMyDocuments } from '@/lib/certification';
import { openDocument } from '@/lib/documents';
import type { CertificationRequest } from '@/lib/types';
import { useLoad } from '@/lib/use-load';

const CARD_GAP = 12;

export default function DocumentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const docs = useLoad(fetchMyDocuments, { intervalMs: 20000 });
  const [downloadError, setDownloadError] = useState('');
  const [index, setIndex] = useState(0);

  const requests = docs.data?.requests ?? [];
  const credentials = docs.data?.credentials ?? [];

  const verified = requests.filter((r) => r.status === 'APPROVED').length;
  const needsAction = requests.filter((r) => r.status === 'RESUBMISSION_REQUIRED' || r.status === 'REJECTED');
  const inProgress = requests.filter((r) => ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATION_REQUIRED'].includes(r.status));
  const firstName = user?.fullName?.split(' ')[0] ?? '';

  // Active cards first, then expired / revoked ones
  const cards = [...credentials].sort((a, b) => Number(b.status === 'ACTIVE') - Number(a.status === 'ACTIVE'));
  const cardWidth = Math.min(width - 56, 360); // leaves a peek of the next card
  const current = cards[Math.min(index, Math.max(cards.length - 1, 0))];
  const currentRequest = current ? requests.find((r) => r.documentId === current.documentId) : undefined;

  async function download(request: CertificationRequest) {
    setDownloadError('');
    try {
      await openDocument(request.documentId, request.originalFileName);
    } catch (e) {
      setDownloadError(e instanceof ApiError ? e.message : 'Could not download the document.');
    }
  }

  return (
    <Page
      title="My documents"
      subtitle={firstName ? `Hi ${firstName}` : 'Welcome back'}
      right={<HeaderButton icon="person-circle-outline" label="Profile" onPress={() => router.push('/account')} />}
      refreshing={docs.refreshing}
      onRefresh={docs.refresh}
      fab={{ label: 'Add document', onPress: () => router.push('/(user)/new-request') }}>
      {docs.loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : docs.error ? (
        <LoadError state={docs} />
      ) : requests.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="folder-open-outline" size={34} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No documents yet</Text>
          <Text style={styles.emptyText}>
            Add an ID, licence or certificate. Once an officer verifies it, your digital card appears here.
          </Text>
          <View style={{ alignSelf: 'stretch' }}>
            <Button title="Add your first document" icon="add-circle-outline" onPress={() => router.push('/(user)/new-request')} />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.tiles}>
            <StatusTile icon="checkmark-circle" value={verified} label="Verified" fg={colors.success} bg={colors.successBg} />
            <StatusTile icon="time" value={inProgress.length} label="In progress" fg={colors.info} bg={colors.infoBg} />
            <StatusTile
              icon="alert-circle"
              value={needsAction.length}
              label="Needs action"
              fg={needsAction.length > 0 ? colors.danger : colors.muted}
              bg={needsAction.length > 0 ? colors.dangerBg : '#ECEFEE'}
            />
          </View>

          {cards.length > 0 ? (
            <View style={styles.cardsBlock}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardWidth + CARD_GAP}
                decelerationRate="fast"
                style={styles.carousel}
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: CARD_GAP }}
                onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + CARD_GAP)))}>
                {cards.map((c) => {
                  const request = requests.find((r) => r.documentId === c.documentId);
                  return (
                    <CredentialCardPressable
                      key={c.credentialId}
                      width={cardWidth}
                      onPress={request ? () => router.push(`/document/${request.requestId}`) : undefined}>
                      <CredentialCard credential={c} holderName={user?.fullName ?? ''} />
                    </CredentialCardPressable>
                  );
                })}
              </ScrollView>

              {cards.length > 1 ? (
                <View style={styles.dots}>
                  {cards.map((c, i) => (
                    <View key={c.credentialId} style={[styles.dot, i === index ? styles.dotActive : null]} />
                  ))}
                </View>
              ) : null}

              {currentRequest ? (
                <View style={styles.actions}>
                  {current?.status === 'ACTIVE' ? (
                    <View style={{ flex: 1 }}>
                      <Button title="Download" variant="secondary" icon="download-outline" onPress={() => download(currentRequest)} />
                    </View>
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Button title="View details" icon="arrow-forward" onPress={() => router.push(`/document/${currentRequest.requestId}`)} />
                  </View>
                </View>
              ) : null}
              {downloadError ? <Banner message={downloadError} /> : null}
            </View>
          ) : null}

          {needsAction.length > 0 ? (
            <View style={styles.section}>
              <Text style={textStyles.section}>Needs your attention</Text>
              {needsAction.map((r) => (
                <DocumentCard key={r.requestId} request={r} onPress={() => router.push(`/document/${r.requestId}`)} />
              ))}
            </View>
          ) : null}

          {inProgress.length > 0 ? (
            <View style={styles.section}>
              <Text style={textStyles.section}>In progress</Text>
              {inProgress.map((r) => (
                <DocumentCard key={r.requestId} request={r} onPress={() => router.push(`/document/${r.requestId}`)} />
              ))}
            </View>
          ) : null}
        </>
      )}
    </Page>
  );
}

/** Wraps a card in a fixed-width touch target. */
function CredentialCardPressable({ width, onPress, children }: { width: number; onPress?: () => void; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [{ width }, pressed ? { opacity: 0.92 } : null]}>
      {children}
    </Pressable>
  );
}

function StatusTile({ icon, value, label, fg, bg }: { icon: IconName; value: number; label: string; fg: string; bg: string }) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={fg} />
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 2,
    ...cardShadow,
  },
  tileIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  tileValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  tileLabel: { fontSize: 12, color: colors.muted },

  cardsBlock: { gap: 14 },
  carousel: { marginHorizontal: -20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, backgroundColor: colors.primary },
  actions: { flexDirection: 'row', gap: 10 },

  section: { gap: 10 },

  empty: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    ...cardShadow,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: 6 },
});
