import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { CredentialStatusBadge } from '@/components/badge';
import { DOC_GRADIENTS } from '@/components/doc-icon';
import { colors } from '@/constants/colors';
import { formatDate } from '@/lib/format';
import { documentTypeLabel, type Credential, type CredentialStatus } from '@/lib/types';

type Props = { credential: Credential; holderName: string; style?: StyleProp<ViewStyle> };

const INACTIVE_GRADIENT: [string, string] = ['#2F3A44', '#6B7782'];
const RINGS = [0, 1, 2, 3, 4, 5, 6];
const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

const SEAL_ICON: Record<CredentialStatus, 'shield-checkmark' | 'time' | 'ban'> = {
  ACTIVE: 'shield-checkmark',
  EXPIRED: 'time',
  REVOKED: 'ban',
};

/**
 * The digital card for a verified document. ID-1 proportions (like a bank card), a fine ring
 * pattern in the corner (a nod to the security printing on banknotes and IDs) and a gold seal.
 * Pass a width through `style`; the height follows from the aspect ratio.
 */
export function CredentialCard({ credential, holderName, style }: Props) {
  const active = credential.status === 'ACTIVE';
  const gradient = active ? DOC_GRADIENTS[credential.documentType] ?? DOC_GRADIENTS.ID_DOCUMENT : INACTIVE_GRADIENT;

  return (
    <View style={[styles.shadow, style]}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.ringAnchor} pointerEvents="none">
          {RINGS.map((i) => {
            const size = 80 + i * 40;
            return (
              <View
                key={i}
                style={[styles.ring, { width: size, height: size, borderRadius: size / 2, left: -size / 2, top: -size / 2 }]}
              />
            );
          })}
        </View>

        <View style={styles.top}>
          <View style={styles.brand}>
            <Ionicons name="shield-checkmark" size={16} color={colors.gold} />
            <Text style={styles.brandText}>MyDocs RSA</Text>
          </View>
          <CredentialStatusBadge status={credential.status} />
        </View>

        <View style={styles.middle}>
          <Text style={styles.type}>{documentTypeLabel(credential.documentType, credential.otherDescription)}</Text>
          <Text style={styles.holder} numberOfLines={1}>
            {holderName}
          </Text>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.small}>Valid until</Text>
            <Text style={styles.value}>{formatDate(credential.validUntil)}</Text>
          </View>
          <View>
            <Text style={styles.small}>Verification code</Text>
            <Text style={[styles.value, { fontFamily: MONO, letterSpacing: 0.5 }]} numberOfLines={1}>
              {credential.verificationCode}
            </Text>
          </View>
        </View>

        {/* The seal: the single gold object on the card */}
        <View style={[styles.seal, !active ? styles.sealMuted : null]}>
          <Ionicons name={SEAL_ICON[credential.status]} size={26} color={active ? colors.gold : '#FFFFFF'} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: 22, boxShadow: '0 14px 28px rgba(10, 31, 68, 0.22)', elevation: 6 },
  card: {
    aspectRatio: 1.586,
    borderRadius: 22,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  ringAnchor: { position: 'absolute', top: 24, right: 24, width: 0, height: 0 },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, letterSpacing: 0.3 },
  middle: { gap: 2, paddingRight: 64 },
  type: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  holder: { color: '#FFFFFF', fontSize: 23, fontWeight: '800', letterSpacing: -0.3 },
  footer: { flexDirection: 'row', gap: 28 },
  small: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600' },
  value: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginTop: 2 },
  seal: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealMuted: { borderColor: 'rgba(255,255,255,0.5)' },
});
