import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/brand';
import { Banner, Button, Field, Screen, textStyles } from '@/components/ui-kit';
import { colors, radius } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { getReturning, type ReturningInfo } from '@/lib/storage';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // undefined = still checking, null = first time on this phone, otherwise who used it before
  const [returning, setReturning] = useState<ReturningInfo | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    getReturning()
      .then((info) => {
        if (!alive) return;
        setReturning(info);
        if (info?.email) setEmail(info.email);
      })
      .catch(() => alive && setReturning(null));
    return () => {
      alive = false;
    };
  }, []);

  const firstTime = returning === null;

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // No manual navigation needed: the root layout sends each role to its own area.
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const heading =
    returning === undefined
      ? 'Log in'
      : firstTime
        ? 'Welcome to MyDocs RSA'
        : `Welcome back${returning.firstName ? `, ${returning.firstName}` : ''}`;
  const sub =
    returning === undefined
      ? ''
      : firstTime
        ? 'Keep your important documents verified and always with you.'
        : 'Log in to see your verified documents.';

  return (
    <Screen hero={<BrandMark headline={'Your documents.\nVerified. Always with you.'} />}>
      <Text style={textStyles.title}>{heading}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}

      {firstTime ? (
        <View style={styles.newHere}>
          <Text style={styles.newHereTitle}>New here?</Text>
          <Text style={styles.newHereText}>Create a free account in a minute, then add your first document.</Text>
          <View style={{ marginTop: 6 }}>
            <Button title="Create an account" icon="person-add-outline" onPress={() => router.push('/register')} />
          </View>
          <Text style={styles.haveAccount}>Already have an account? Log in below.</Text>
        </View>
      ) : null}

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password" />

      <Link href="./forgot-password" style={styles.forgot}>
        Forgot password?
      </Link>

      {error ? (
        <View style={styles.gap}>
          <Banner message={error} />
        </View>
      ) : null}

      <View style={styles.gap}>
        <Button title="Log in" onPress={handleLogin} loading={loading} />
      </View>

      {!firstTime ? (
        <View style={styles.footer}>
          <Text style={{ color: colors.muted }}>New to MyDocs RSA?</Text>
          <Link href="./register" style={textStyles.link}>
            Create an account
          </Link>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { fontSize: 15, color: colors.muted, marginTop: 2, marginBottom: 4 },
  gap: { marginTop: 18 },
  forgot: { alignSelf: 'flex-end', color: colors.primary, fontWeight: '700', fontSize: 14, marginTop: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 22 },
  newHere: {
    backgroundColor: colors.cardTint,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newHereTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  newHereText: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  haveAccount: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
