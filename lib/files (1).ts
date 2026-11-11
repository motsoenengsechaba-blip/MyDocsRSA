import * as DocumentPicker from "expo-document-picker";

export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  webFile?: File; // only on the web version
};

// Same rules as the backend (DocumentValidationService)
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];

function mimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  return "image/jpeg";
}

/** Opens the phone's file picker. Returns null if the user cancels. */
export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/jpeg", "image/png"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? mimeFromName(asset.name),
    size: asset.size,
    webFile: asset.file,
  };
}

/** Returns an error message, or null if the file is fine. */
export function validateFile(file: PickedFile): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return "Only PDF, JPG, JPEG and PNG files are allowed.";
  }
  if (file.size !== undefined && file.size > MAX_FILE_BYTES) {
    return "The file is too large. The limit is 10 MB.";
  }
  if (file.size === 0) {
    return "That file is empty. Choose another one.";
  }
  return null;
}
