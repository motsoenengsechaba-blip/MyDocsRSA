import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Banner, Button, Screen, textStyles } from '@/components/ui-kit';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, ApiError } from '@/lib/api';

type Props = {
  roleLabel: string;
  /** A protected endpoint used to prove the token + role are accepted by the backend. */
  checkEndpoint?: string;
  checkLabel?: string;
};

/**
 * Temporary landing screen used in Step 1. It shows who is logged in and makes one
 * real, role-protected API call so we know the connection works. Each role's real
 * screens replace this in later steps.
 */
export function RoleHome({ roleLabel, checkEndpoint, checkLabel }: Props) {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!checkEndpoint) return;
    apiRequest<unknown>(checkEndpoint)
      .then((data) => {
        const count = Array.isArray(data) ? ` (${data.length} found)` : '';
        setStatus({ kind: 'success', message: `Backend connected${count}` });
      })
      .catch((e: unknown) => {
        const message = e instanceof ApiError ? e.message : 'Something went wrong';
        setStatus({ kind: 'error', message });
      });
  }, [checkEndpoint]);

  return (
    <Screen>
      <Text style={textStyles.title}>{roleLabel}</Text>
      <Text style={textStyles.subtitle}>Signed in as {user?.fullName}</Text>

      <View style={styles.card}>
        <Text style={styles.row}>Email: {user?.email}</Text>
        <Text style={styles.row}>Role: {user?.role}</Text>
        {checkLabel ? <Text style={styles.row}>Check: {checkLabel}</Text> : null}
      </View>

      {status ? <Banner kind={status.kind} message={status.message} /> : null}

      <Button title="Sign out" variant="secondary" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { color: colors.text, fontSize: 15 },
});
