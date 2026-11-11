import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { FilterChips, type Chip } from '@/components/filter-chips';
import { LoadError } from '@/components/load-error';
import { Page } from '@/components/page';
import { PersonCard } from '@/components/person-card';
import { SearchField } from '@/components/search-field';
import { InsightCard } from '@/components/segment-bar';
import { colors } from '@/constants/colors';
import type { Role } from '@/context/AuthContext';
import { fetchAdminUsers } from '@/lib/admin';
import { useLoad } from '@/lib/use-load';

export default function PeopleScreen() {
  const people = useLoad(fetchAdminUsers);
  const [role, setRole] = useState<Role>('USER');
  const [search, setSearch] = useState('');

  const all = people.data ?? [];
  const count = (r: Role) => all.filter((p) => p.role === r).length;
  const chips: Chip<Role>[] = [
    { value: 'USER', label: 'Users', count: count('USER') },
    { value: 'POLICE_OFFICER', label: 'Officers', count: count('POLICE_OFFICER') },
    { value: 'ADMIN', label: 'Admins', count: count('ADMIN') },
  ];

  const q = search.trim().toLowerCase();
  const shown = all.filter(
    (p) => p.role === role && (!q || p.fullName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)),
  );

  return (
    <Page
      title="People"
      subtitle="Promote a user to officer from the Users list."
      refreshing={people.refreshing}
      onRefresh={people.refresh}>
      <InsightCard
        title="Who is on the system"
        segments={[
          { label: 'Users', value: count('USER'), color: '#1D4E89' },
          { label: 'Officers', value: count('POLICE_OFFICER'), color: '#0B6B4F' },
          { label: 'Admins', value: count('ADMIN'), color: '#B8902F' },
          { label: 'Inactive', value: all.filter((p) => !p.active).length, color: '#B42318' },
        ]}
      />
      <SearchField value={search} onChangeText={setSearch} placeholder="Search by name or email" />
      <FilterChips chips={chips} selected={role} onSelect={setRole} />

      {people.loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : people.error ? (
        <LoadError state={people} />
      ) : shown.length === 0 ? (
        <Text style={styles.empty}>No accounts match.</Text>
      ) : (
        shown.map((p) => <PersonCard key={p.id} person={p} onChanged={people.refresh} />)
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 20 },
});
