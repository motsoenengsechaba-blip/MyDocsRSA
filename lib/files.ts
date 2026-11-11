import * as DocumentPicker from 'expo-document-picker';
import { File as FsFile, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  webFile?: File; // only on the web version
};

// Same rules as the backend (DocumentValidationService)
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

function mimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  return 'image/jpeg';
}

/** Opens the phone's file picker. Returns null if the user cancels. */
export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/jpeg', 'image/png'],
    // On Android, keep the URI's read grant until we copy into FileSystem's
    // scoped cache below. The DocumentPicker cache can be outside this scope
    // in Expo Go. Keep the original display name and MIME metadata as well.
    copyToCacheDirectory: Platform.OS !== 'android',
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const selected: PickedFile = {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? mimeFromName(asset.name),
    size: asset.size,
    webFile: asset.file,
  };
  if (Platform.OS !== 'android') return selected;

  const problem = validateFile(selected);
  if (problem) throw new Error(problem);
  const safeName = selected.name.replace(/[^A-Za-z0-9._-]/g, '_');
  const target = new FsFile(Paths.cache, `upload-${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`);
  try {
    await new FsFile(selected.uri).copy(target);
    if (!target.exists) throw new Error('The selected document could not be read.');
    return { ...selected, uri: target.uri, size: target.size };
  } catch {
    try { if (target.exists) target.delete(); } catch { /* Best-effort partial-copy cleanup. */ }
    throw new Error('Could not read the selected document. Download it to this phone, then choose it again.');
  }
}

/** Returns an error message, or null if the file is fine. */
export function validateFile(file: PickedFile): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return 'Only PDF, JPG, JPEG and PNG files are allowed.';
  }
  if (file.size !== undefined && file.size > MAX_FILE_BYTES) {
    return 'The file is too large. The limit is 10 MB.';
  }
  if (file.size === 0) {
    return 'That file is empty. Choose another one.';
  }
  return null;
}
