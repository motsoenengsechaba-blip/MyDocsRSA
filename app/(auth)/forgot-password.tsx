import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BrandMark } from "@/components/brand";
import { Banner, Button, Field, Screen, textStyles } from "@/components/ui-kit";
import { colors } from "@/constants/colors";
import { ApiError } from "@/lib/api";
import { requestPasswordReset } from "@/lib/auth-recovery";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter the email address you registered with.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      router.push({
        pathname: "/reset-password",
        params: { email: email.trim() },
      });
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen hero={<BrandMark compact />}>
      <Text style={styles.heading}>Forgot your password?</Text>
      <Text style={styles.sub}>
        Enter the email you registered with and we will email you a 6-digit code
        to set a new password.
      </Text>

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="you@example.com"
      />

      {error ? (
        <View style={styles.gap}>
          <Banner message={error} />
        </View>
      ) : null}

      <View style={styles.gap}>
        <Button
          title="Send reset code"
          icon="mail-outline"
          onPress={send}
          loading={loading}
        />
      </View>

      <View style={styles.footer}>
        <Link href="./login" style={textStyles.link}>
          Back to log in
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 15,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 4,
    lineHeight: 21,
  },
  gap: { marginTop: 18 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 22 },
});
