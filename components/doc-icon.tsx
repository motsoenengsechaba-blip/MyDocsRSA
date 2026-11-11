import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/ui-kit';
import type { DocumentType } from '@/lib/types';

/** One accent colour per document type (icon tiles, small highlights). */
export const DOC_COLORS: Record<DocumentType, string> = {
  ID_DOCUMENT: '#1D4E89',
  DRIVERS_LICENSE: '#0B6B4F',
  PROOF_OF_RESIDENCE: '#6D3FB2',
  ACADEMIC_CERTIFICATE: '#A66A12',
  PROFESSIONAL_DRIVERS_PERMIT: '#B3263E',
  OTHER: '#475569',
};

/** Dark -> light gradient pairs for the digital cards, so each document type is recognisable at a glance. */
export const DOC_GRADIENTS: Record<DocumentType, [string, string]> = {
  ID_DOCUMENT: ['#0A1F44', '#1F5FA8'],
  DRIVERS_LICENSE: ['#073B2D', '#14946D'],
  PROOF_OF_RESIDENCE: ['#2A1659', '#7A4FC9'],
  ACADEMIC_CERTIFICATE: ['#4A2A06', '#C58A2B'],
  PROFESSIONAL_DRIVERS_PERMIT: ['#4A0E1C', '#C23A55'],
  OTHER: ['#1F2937', '#6B7280'],
};

export const DOC_ICONS: Record<DocumentType, IconName> = {
  ID_DOCUMENT: 'card-outline',
  DRIVERS_LICENSE: 'car-outline',
  PROOF_OF_RESIDENCE: 'home-outline',
  ACADEMIC_CERTIFICATE: 'school-outline',
  PROFESSIONAL_DRIVERS_PERMIT: 'bus-outline',
  OTHER: 'document-text-outline',
};

/** A rounded tile with an icon that matches the document type. */
export function DocIcon({ type, size = 46 }: { type: DocumentType; size?: number }) {
  const color = DOC_COLORS[type] ?? '#1D4E89';
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: `${color}1A`, borderColor: `${color}33` }]}>
      <Ionicons name={DOC_ICONS[type] ?? 'document-text-outline'} size={size * 0.52} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
