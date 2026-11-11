import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { FilterChips, type Chip } from '@/components/filter-chips';
import { LoadError } from '@/components/load-error';
import { Page } from '@/components/page';
import { RequestRow } from '@/components/request-row';
import { SearchField } from '@/components/search-field';
import { InsightCard, STATUS_COLORS } from '@/components/segment-bar';
import { colors } from '@/constants/colors';
import { fetchAdminRequests } from '@/lib/admin';
import { formatDate } from '@/lib/format';
import { requestTitle, type CertificationRequest } from '@/lib/types';
import { useLoad } from '@/lib/use-load';

type Filter = 'ALL' | 'WAITING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUIRED';

function matches(request: CertificationRequest, filter: Filter) {
  switch (filter) {
    case 'ALL':
      return true;
    case 'WAITING':
      return request.status === 'SUBMITTED' || request.status === 'INVESTIGATION_REQUIRED';
    default:
      return request.status === filter;
  }
}

function handledBy(request: CertificationRequest) {
  if (!request.reviewedByName) return 'Not picked up by an officer yet';
  return request.reviewedAt
    ? `Decided by ${request.reviewedByName} on ${formatDate(request.reviewedAt)}`
    : `Being reviewed by ${request.reviewedByName}`;
}

export default function AllRequestsScreen() {
  const requests = useLoad(fetchAdminRequests);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');

  const all = requests.data ?? [];
  const count = (f: Filter) => all.filter((r) => matches(r, f)).length;
  const chips: Chip<Filter>[] = [
    { value: 'ALL', label: 'All', count: all.length },
    { value: 'WAITING', label: 'Pending', count: count('WAITING') },
    { value: 'UNDER_REVIEW', label: 'In review', count: count('UNDER_REVIEW') },
    { value: 'APPROVED', label: 'Verified', count: count('APPROVED') },
    { value: 'REJECTED', label: 'Rejected', count: count('REJECTED') },
    { value: 'RESUBMISSION_REQUIRED', label: 'Resubmit', count: count('RESUBMISSION_REQUIRED') },
  ];

  const q = search.trim().toLowerCase();
  const shown = all.filter(
    (r) =>
      matches(r, filter) &&
      (!q || (r.applicantName ?? '').toLowerCase().includes(q) || requestTitle(r).toLowerCase().includes(q)),
  );

  return (
    <Page title="All Requests" subtitle="Monitoring only. Officers make the decisions." refreshing={requests.refreshing} onRefresh={requests.refresh}>
      <InsightCard
        title="Pipeline at a glance"
        segments={[
          { label: 'Pending', value: count('WAITING'), color: STATUS_COLORS.pending },
          { label: 'In review', value: count('UNDER_REVIEW'), color: STATUS_COLORS.review },
          { label: 'Verified', value: count('APPROVED'), color: STATUS_COLORS.verified },
          { label: 'Rejected', value: count('REJECTED'), color: STATUS_COLORS.rejected },
          { label: 'Resubmit', value: count('RESUBMISSION_REQUIRED'), color: STATUS_COLORS.resubmit },
        ]}
      />
      <SearchField value={search} onChangeText={setSearch} placeholder="Search by applicant or document" />
      <FilterChips chips={chips} selected={filter} onSelect={setFilter} />

      {requests.loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : requests.error ? (
        <LoadError state={requests} />
      ) : shown.length === 0 ? (
        <Text style={styles.empty}>No requests match.</Text>
      ) : (
        shown.map((r) => (
          <RequestRow
            key={r.requestId}
            request={r}
            lines={[handledBy(r)]}
            note={
              r.notes && (r.status === 'REJECTED' || r.status === 'RESUBMISSION_REQUIRED') ? `Officer note: ${r.notes}` : undefined
            }
          />
        ))
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 20 },
});
