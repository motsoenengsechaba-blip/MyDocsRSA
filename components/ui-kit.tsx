import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/constants/colors';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Sign-in / register page: a dark gradient hero (pass the BrandMark as `hero`),
 * with the form on a white sheet that overlaps the bottom of the hero.
 */
export function Screen({ children, hero }: { children: ReactNode; hero?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
          <LinearGradient
            colors={[colors.navy, colors.navyMid, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: insets.top + 32 }]}>
            {hero}
          </LinearGradient>
          <View style={styles.sheet}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

type FieldProps = TextInputProps & { label: string; error?: string; icon?: IconName };

export function Field({ label, error, icon, style, onFocus, onBlur, secureTextEntry, ...inputProps }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused ? styles.inputFocused : null, error ? styles.inputError : null]}>
        {icon ? <Ionicons name={icon} size={19} color={focused ? colors.primary : colors.faint} /> : null}
        <TextInput
          placeholderTextColor={colors.faint}
          style={[styles.input, style]}
          secureTextEntry={isPassword && hidden}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

type Variant = 'primary' | 'secondary' | 'success' | 'danger';

const VARIANTS: Record<Variant, { bg: string; border: string; text: string }> = {
  primary: { bg: colors.primary, border: colors.primary, text: colors.primaryText },
  secondary: { bg: colors.card, border: colors.border, text: colors.navy },
  success: { bg: colors.success, border: colors.success, text: '#FFFFFF' },
  danger: { bg: colors.dangerBg, border: colors.dangerBorder, text: colors.danger },
};

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
};

export function Button({ title, onPress, loading, variant = 'primary', icon, disabled }: ButtonProps) {
  const v = VARIANTS[variant];
  const inactive = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border },
        variant === 'primary' ? styles.buttonGlow : null,
        pressed ? styles.buttonPressed : null,
        disabled && !loading ? { opacity: 0.5 } : null,
      ]}>
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <View style={styles.buttonRow}>
          {icon ? <Ionicons name={icon} size={18} color={v.text} /> : null}
          <Text style={[styles.buttonText, { color: v.text }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

type BannerKind = 'error' | 'success' | 'info';

const BANNERS: Record<BannerKind, { bg: string; fg: string; icon: IconName }> = {
  error: { bg: colors.dangerBg, fg: colors.danger, icon: 'alert-circle' },
  success: { bg: colors.successBg, fg: colors.success, icon: 'checkmark-circle' },
  info: { bg: colors.infoBg, fg: colors.info, icon: 'information-circle' },
};

export function Banner({ message, kind = 'error' }: { message: string; kind?: BannerKind }) {
  const b = BANNERS[kind];
  return (
    <View style={[styles.banner, { backgroundColor: b.bg }]}>
      <Ionicons name={b.icon} size={20} color={b.fg} />
      <Text style={[styles.bannerText, { color: b.fg }]}>{message}</Text>
    </View>
  );
}

export const textStyles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 4 },
  link: { color: colors.primary, fontWeight: '700' },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: colors.navy },
  scroll: { flexGrow: 1, backgroundColor: '#FFFFFF' },
  hero: { paddingHorizontal: 26, paddingBottom: 64 },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 6,
  },
  field: { marginTop: 14, gap: 7 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6F8F7',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
  },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: colors.text },
  inputFocused: { borderColor: colors.primary, backgroundColor: '#FFFFFF' },
  inputError: { borderColor: colors.danger },
  fieldError: { color: colors.danger, fontSize: 13 },
  button: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  buttonGlow: { boxShadow: '0 8px 18px rgba(11, 107, 79, 0.28)', elevation: 3 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  buttonText: { fontSize: 16, fontWeight: '700' },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: radius.sm },
  bannerText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
