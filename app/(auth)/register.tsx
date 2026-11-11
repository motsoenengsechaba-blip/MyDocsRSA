import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/brand';
import { PasswordStrength } from '@/components/password-strength';
import { Banner, Button, Field, Screen, textStyles } from '@/components/ui-kit';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { checkPassword } from '@/lib/password';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Enter a valid email address';
    if (!checkPassword(password, { email, name: fullName }).valid) errors.password = 'Choose a stronger password (see the checklist)';
    if (confirm !== password) errors.confirm = 'The two passwords do not match';
    return errors;
  }

  async function handleRegister() {
    const errors = validate();
    setFieldErrors(errors);
    setError('');
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await register({ fullName, email, password, phoneNumber });
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

  return (
    <Screen hero={<BrandMark compact />}>
      <Text style={styles.heading}>Create your account</Text>
      <Text style={styles.sub}>Add your documents and get them verified by an officer.</Text>

      <Field label="Full name" value={fullName} onChangeText={setFullName} error={fieldErrors.fullName} placeholder="Your full name" />
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
        label="Phone number (optional)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        error={fieldErrors.phoneNumber}
        keyboardType="phone-pad"
        placeholder="+27 12 345 6789"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        secureTextEntry
        placeholder="Create a strong password"
      />
      <PasswordStrength password={password} email={email} name={fullName} />
      <Field
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        error={fieldErrors.confirm}
        secureTextEntry
        placeholder="Type it again"
      />

      {error ? (
        <View style={styles.gap}>
          <Banner message={error} />
        </View>
      ) : null}

      <View style={styles.gap}>
        <Button title="Create account" onPress={handleRegister} loading={loading} />
      </View>

      <View style={styles.footer}>
        <Text style={{ color: colors.muted }}>Already have an account?</Text>
        <Link href="./login" style={textStyles.link}>
          Log in
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  sub: { fontSize: 15, color: colors.muted, marginTop: 2, marginBottom: 4 },
  gap: { marginTop: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 22 },
});
