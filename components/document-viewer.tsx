import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Banner, Button } from '@/components/ui-kit';
import { cardShadow, colors, radius } from '@/constants/colors';
import { ApiError } from '@/lib/api';
import { documentUrl, isImageFile, openDocument } from '@/lib/documents';
import { getToken } from '@/lib/storage';

type Props = {
  documentId: number;
  fileName?: string;
};

/** Shows an inline preview for images and an "Open document" button for any file type. */
export function DocumentViewer({ documentId, fileName }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getToken().then(setToken);
  }, []);

  const canPreview = Platform.OS !== 'web' && isImageFile(fileName) && !!token && !previewFailed;

  async function handleOpen() {
    setError('');
    setOpening(true);
    try {
      await openDocument(documentId, fileName);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not open the document.');
    } finally {
      setOpening(false);
    }
  }

  return (
    <View style={styles.box}>
      {canPreview ? (
        <Image
          source={{ uri: documentUrl(documentId), headers: { Authorization: `Bearer ${token}` } }}
          style={styles.preview}
          contentFit="contain"
          onError={() => setPreviewFailed(true)}
        />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name={isImageFile(fileName) ? 'image-outline' : 'document-text-outline'} size={34} color={colors.primary} />
          <Text style={styles.fileName} numberOfLines={2}>
            {fileName ?? 'Uploaded document'}
          </Text>
          <Text style={styles.fileHint}>{isImageFile(fileName) ? 'Preview not available' : 'PDF document'}</Text>
        </View>
      )}

      {error ? <Banner message={error} /> : null}
      <Button title="Open full document" icon="open-outline" variant="secondary" onPress={handleOpen} loading={opening} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
    ...cardShadow,
  },
  preview: { width: '100%', height: 300, borderRadius: radius.sm, backgroundColor: '#EEF1F5' },
  placeholder: {
    height: 130,
    borderRadius: radius.sm,
    backgroundColor: colors.cardTint,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 4,
  },
  fileName: { fontSize: 15, fontWeight: '700', color: colors.text, textAlign: 'center' },
  fileHint: { fontSize: 13, color: colors.muted },
});
