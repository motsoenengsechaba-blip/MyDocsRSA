import { File as FsFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { API_BASE_URL } from '@/constants/api';
import { ApiError } from '@/lib/api';
import { getToken } from '@/lib/storage';

export function documentUrl(documentId: number) {
  return `${API_BASE_URL}/api/documents/${documentId}/download`;
}

function extensionOf(fileName?: string | null) {
  return fileName?.split('.').pop()?.toLowerCase() ?? '';
}

export function isImageFile(fileName?: string | null) {
  return ['jpg', 'jpeg', 'png'].includes(extensionOf(fileName));
}

function mimeFor(fileName?: string | null) {
  const ext = extensionOf(fileName);
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  return 'image/jpeg';
}

/**
 * Downloads the uploaded document (the download endpoint needs the JWT, so a plain link
 * will not work) and opens it: a new browser tab on web, the phone's "open with" sheet on mobile.
 */
export async function openDocument(documentId: number, fileName?: string | null) {
  const token = await getToken();
  if (!token) throw new ApiError('You are signed out. Sign in again.', 401);
  const headers = { Authorization: `Bearer ${token}` };

  if (Platform.OS === 'web') {
    const response = await fetch(documentUrl(documentId), { headers });
    if (!response.ok) throw new ApiError('Could not download the document.', response.status);
    const blob = await response.blob();
    window.open(URL.createObjectURL(blob), '_blank');
    return;
  }

  const safeName = (fileName ?? 'document').replace(/[^\w.\-]/g, '_');
  const target = new FsFile(Paths.cache, `doc-${documentId}-${safeName}`);

  try {
    const downloaded = await FsFile.downloadFileAsync(documentUrl(documentId), target, {
      headers,
      idempotent: true,
    });
    if (!(await Sharing.isAvailableAsync())) {
      throw new ApiError('This device cannot open files from the app.', 0);
    }
    await Sharing.shareAsync(downloaded.uri, {
      mimeType: mimeFor(fileName),
      dialogTitle: 'Open document',
    });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('Could not download the document. Check your connection and try again.', 0);
  }
}
