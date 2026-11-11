import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { FilterChips, type Chip } from '@/components/filter-chips';
import { LoadError } from '@/components/load-error';
import { Page } from '@/components/page';
import { RequestRow } from '@/components/request-row';
import { SearchField } from '@/components/search-field';
import { cardShadow, colors, radius } from '@/constants/colors';
import { fetchOfficerQueue } from '@/lib/officer';
import { requestTitle, type CertificationRequest } from '@/lib/types';
import { useLoad } from '@/lib/use-load';

type Tab = 'WAITING' | 'REVIEW';

export default function OfficerQueueScreen() {
  const router = useRouter();
  const queue = useLoad(fetchOfficerQueue);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('WAITING');

  const q = search.trim().toLowerCase();
  const matches = (r: CertificationRequest) =>
    !q || (r.applicantName ?? '').toLowerCase().includes(q) || requestTitle(r).toLowerCase().includes(q);

  const allPending = queue.data?.pending ?? [];
  const allInReview = queue.data?.inReview ?? [];
  const list = (tab === 'WAITING' ? allPending : allInReview).filter(matches);

  const chips: Chip<Tab>[] = [
    { value: 'WAITING', label: 'Pending', count: allPending.length },
    { value: 'REVIEW', label: 'In review', count: allInReview.length },
  ];

  const open = (r: CertificationRequest) => router.push(`/review/${r.requestId}`);

  return (
    <Page
      title="Verification queue"
      subtitle={`${allPending.length} waiting · ${allInReview.length} in review`}
      refreshing={queue.refreshing}
      onRefresh={queue.refresh}>
      <FilterChips chips={chips} selected={tab} onSelect={setTab} />
      <SearchField value={search} onChangeText={setSearch} placeholder="Search by applicant or document" />

      {queue.loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : queue.error ? (
        <LoadError state={queue} />
      ) : list.length === 0 ? (
        <Empty
          text={
            q
              ? 'No requests match your search.'
              : tab === 'WAITING'
                ? 'Nothing is waiting. New requests appear here.'
                : 'No requests are being reviewed right now.'
          }
        />
      ) : (
        list.map((r) => (
          <RequestRow
            key={r.requestId}
            request={r}
            onPress={() => open(r)}
            lines={tab === 'REVIEW' && r.reviewedByName ? [`Being reviewed by ${r.reviewedByName}`] : []}
          />
        ))
      )}
    </Page>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="checkmark-done-outline" size={22} color={colors.faint} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    ...cardShadow,
  },
  emptyText: { flex: 1, fontSize: 14, color: colors.muted },
});
