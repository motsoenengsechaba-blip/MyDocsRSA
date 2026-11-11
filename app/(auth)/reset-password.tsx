import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/brand';
import { PasswordStrength } from '@/components/password-strength';
import { Banner, Button, Field, Screen, textStyles } from '@/components/ui-kit';
import { colors, radius } from '@/constants/colors';
import { ApiError } from '@/lib/api';
import { requestPasswordReset, resetPassword } from '@/lib/auth-recovery';
import { checkPassword } from '@/lib/password';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [info, setInfo] = useState('If that email is registered, a code is on its way. It can take a minute to arrive.');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    setError('');
    try {
      await requestPasswordReset(email);
      setInfo('If your email has an active account, a new code will be sent. Please check your inbox and spam folder.');
      setCooldown(60);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send a new code. Try again.');
    }
  }

  async function submit() {
    const errors: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Enter a valid email address';
    if (!/^\d{6}$/.test(code.trim())) errors.code = 'Enter the 6-digit code from the email';
    if (!checkPassword(password, { email }).valid) errors.password = 'Choose a stronger password (see the checklist)';
    if (confirm !== password) errors.confirm = 'The two passwords do not match';
    setFieldErrors(errors);
    setError('');
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await resetPassword({ email, code, newPassword: password });
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError) {
        setFieldErrors(e.fieldErrors ?? {});
        setError(e.message);
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Screen hero={<BrandMark compact />}>
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={38} color="#FFFFFF" />
          </View>
          <Text style={styles.heading}>Password changed</Text>
          <Text style={styles.successText}>You can now log in with your new password.</Text>
        </View>
        <View style={styles.gap}>
          <Button title="Go to log in" onPress={() => router.replace('/login')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen hero={<BrandMark compact />}>
      <Text style={styles.heading}>Set a new password</Text>
      <Banner kind="info" message={info} />

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <Field
        label="6-digit code"
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
        error={fieldErrors.code}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="123456"
      />
      <Field
        label="New password"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password ?? fieldErrors.newPassword}
        secureTextEntry
        placeholder="Create a strong password"
      />
      <PasswordStrength password={password} email={email} />
      <Field label="Confirm new password" value={confirm} onChangeText={setConfirm} error={fieldErrors.confirm} secureTextEntry placeholder="Type it again" />

      {error ? (
        <View style={styles.gap}>
          <Banner message={error} />
        </View>
      ) : null}

      <View style={styles.gap}>
        <Button title="Change password" onPress={submit} loading={loading} />
      </View>

      <Pressable onPress={resend} disabled={cooldown > 0} style={styles.resend}>
        <Text style={[textStyles.link, cooldown > 0 ? { color: colors.faint } : null]}>
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        </Text>
      </Pressable>

      <View style={styles.footer}>
        <Link href="./login" style={textStyles.link}>
          Back to log in
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.4, marginBottom: 6 },
  gap: { marginTop: 18 },
  resend: { alignSelf: 'center', marginTop: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  success: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cardTint,
    borderRadius: radius.lg,
    padding: 24,
    marginTop: 8,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: { fontSize: 15, color: colors.muted, textAlign: 'center' },
});
