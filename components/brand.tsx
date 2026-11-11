import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

/** The app logo: a shield with a gold outline. The same tile is used on the welcome screen, sign-in and register. */
export function LogoTile({ size = 58 }: { size?: number }) {
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Ionicons name="shield-checkmark" size={size * 0.52} color={colors.gold} />
    </View>
  );
}

/** Logo, name and optional headline. Sits on the dark navy hero. */
export function BrandMark({ compact = false, headline }: { compact?: boolean; headline?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <LogoTile size={compact ? 46 : 58} />
        <View>
          <Text style={styles.name}>MyDocs RSA</Text>
          <Text style={styles.tagline}>Secure document management</Text>
        </View>
      </View>
      {headline ? <Text style={styles.headline}>{headline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 28 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tile: {
    backgroundColor: 'rgba(201, 162, 75, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 75, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  headline: { fontSize: 32, lineHeight: 38, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
});
