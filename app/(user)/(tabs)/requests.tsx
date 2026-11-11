import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { LoadError } from '@/components/load-error';
import { Page } from '@/components/page';
import { RequestCard } from '@/components/request-card';
import { cardShadow, colors, radius } from '@/constants/colors';
import { fetchMyRequests } from '@/lib/certification';
import { useStatusUpdates } from '@/lib/status-updates';
import { useLoad } from '@/lib/use-load';

export default function RequestsScreen() {
  const router = useRouter();
  const requests = useLoad(fetchMyRequests, { intervalMs: 15000 });
  const { acknowledge } = useStatusUpdates();

  // Looking at this tab counts as having seen every update
  useFocusEffect(
    useCallback(() => {
      acknowledge();
    }, [acknowledge]),
  );

  return (
    <Page
      title="Requests"
      subtitle="Track every submission. Statuses update by themselves."
      refreshing={requests.refreshing}
      onRefresh={requests.refresh}>
      {requests.loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : requests.error ? (
        <LoadError state={requests} />
      ) : requests.data && requests.data.length > 0 ? (
        requests.data.map((request) => (
          <RequestCard
            key={request.requestId}
            request={request}
            onPress={() => router.push(`/document/${request.requestId}`)}
            onChanged={requests.refresh}
          />
        ))
      ) : (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={34} color={colors.faint} />
          <Text style={styles.emptyTitle}>No requests yet</Text>
          <Text style={styles.emptyText}>Your certification requests will show up here.</Text>
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    ...cardShadow,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center' },
});
