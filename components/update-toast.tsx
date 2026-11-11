import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { STATUS_PHRASE, useStatusUpdates } from '@/lib/status-updates';
import type { RequestStatus } from '@/lib/types';

const LOOK: Record<RequestStatus, { icon: 'checkmark-circle' | 'close-circle' | 'refresh-circle' | 'time'; color: string }> = {
  SUBMITTED: { icon: 'time', color: '#93C5FD' },
  UNDER_REVIEW: { icon: 'time', color: '#93C5FD' },
  INVESTIGATION_REQUIRED: { icon: 'time', color: '#93C5FD' },
  APPROVED: { icon: 'checkmark-circle', color: '#34D399' },
  REJECTED: { icon: 'close-circle', color: '#F87171' },
  RESUBMISSION_REQUIRED: { icon: 'refresh-circle', color: '#FBBF24' },
};

/** A banner that slides down when an officer changes the status of one of the person's requests. */
export function UpdateToast() {
  const { updates, acknowledge } = useStatusUpdates();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [slide] = useState(() => new Animated.Value(-140));

  const update = updates[0];
  const key = update ? `${update.requestId}-${update.to}` : '';

  useEffect(() => {
    if (!key) return;
    slide.setValue(-140);
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
  }, [key, slide]);

  if (!update) return null;
  const look = LOOK[update.to];
  const showReason = (update.to === 'REJECTED' || update.to === 'RESUBMISSION_REQUIRED') && !!update.notes?.trim();

  return (
    <Animated.View style={[styles.wrap, { top: insets.top + 8, transform: [{ translateY: slide }] }]}>
      <Pressable
        onPress={() => {
          acknowledge(update.requestId);
          router.push(`/document/${update.requestId}`);
        }}
        style={styles.toast}
        accessibilityRole="button">
        <Ionicons name={look.icon} size={28} color={look.color} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title}>
            {update.title} is now {STATUS_PHRASE[update.to]}
          </Text>
          <Text style={styles.sub} numberOfLines={2}>
            {showReason ? `Reason: ${update.notes}` : 'Tap to see the details'}
            {updates.length > 1 ? `  ·  +${updates.length - 1} more` : ''}
          </Text>
        </View>
        <Pressable onPress={() => acknowledge(update.requestId)} hitSlop={12} accessibilityLabel="Dismiss">
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14, zIndex: 50 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.navy,
    borderRadius: 18,
    padding: 14,
    boxShadow: '0 12px 28px rgba(10, 31, 68, 0.35)',
    elevation: 10,
  },
  title: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
});
