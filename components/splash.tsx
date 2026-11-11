import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { LogoTile } from '@/components/brand';
import { colors } from '@/constants/colors';

const RINGS = [0, 1, 2, 3, 4, 5, 6, 7];

/** Full-screen navy welcome page: the logo, name and tagline. Shown on launch and while the saved login is restored. */
export function Splash() {
  return (
    <LinearGradient colors={[colors.navy, colors.navyMid, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.center}>
        <LogoTile size={116} />
        <Text style={styles.name}>MyDocs RSA</Text>
        <Text style={styles.line}>Your documents. Verified. Always with you.</Text>
      </View>

      <Text style={styles.steps}>Store   ·   Verify   ·   Access</Text>

      {/* Fine ring pattern rising from the bottom edge (security-print feel, like the digital cards) */}
      <View style={styles.ringAnchor} pointerEvents="none">
        {RINGS.map((i) => {
          const size = 120 + i * 56;
          return (
            <View
              key={i}
              style={[styles.ring, { width: size, height: size, borderRadius: size / 2, left: -size / 2, top: -size / 2 }]}
            />
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  center: { alignItems: 'center', gap: 18, paddingHorizontal: 32 },
  name: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  line: { color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center' },
  steps: { position: 'absolute', bottom: '24%', color: 'rgba(255,255,255,0.65)', fontSize: 14 },
  ringAnchor: { position: 'absolute', bottom: 0, left: '50%', width: 0, height: 0 },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(201,162,75,0.16)' },
});
