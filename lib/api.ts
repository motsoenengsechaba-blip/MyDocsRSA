import { File as FsFile, UploadType } from 'expo-file-system';
import { Platform } from 'react-native';

import { API_BASE_URL } from '@/constants/api';
import type { PickedFile } from '@/lib/files';
import { getToken } from '@/lib/storage';

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// The AuthContext registers this so an expired token logs the user out automatically.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

/** Any HTTP answer (even an error page) means the server is up. */
async function serverIsReachable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    await fetch(`${API_BASE_URL}/api/auth/login`, { method: 'GET', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Turns a finished HTTP response into data, or throws a friendly ApiError. */
function parseResponse<T>(status: number, text: string, authenticated: boolean): T {
  // Some error responses (e.g. 401/403 from Spring Security) have an empty body.
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (status < 200 || status >= 300) {
    if (status === 401 && authenticated) {
      onUnauthorized?.();
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }

    let message: string = data?.message ?? `Request failed (${status})`;
    if (status === 403 && !data?.message) {
      message = 'You do not have permission to do that.';
    }
    if (status === 413) {
      message = 'That file is too large. The limit is 10 MB.';
    }
    throw new ApiError(message, status, data?.errors);
  }

  return data as T;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown; // sent as JSON
  auth?: boolean; // attach the JWT (default true)
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    console.warn(`[api] ${method} ${path} failed:`, e);
    if (await serverIsReachable()) {
      throw new ApiError('The server is running, but the request failed. Try again.', 0);
    }
    throw new ApiError(
      `Cannot reach the server at ${API_BASE_URL}. Check that the backend is running and your phone is on the same Wi-Fi.`,
      0,
    );
  }

  return parseResponse<T>(response.status, await response.text(), auth);
}

type UploadOptions = {
  file: PickedFile;
  fields?: Record<string, string>; // extra form fields sent with the file
  fieldName?: string; // name of the file field (the backend expects "file")
};

/**
 * Uploads a file as multipart/form-data with the JWT attached.
 *
 * On the phone this uses expo-file-system's native uploader, which streams the file from
 * storage (Expo's fetch does not accept React Native's { uri, name, type } form parts).
 * On the web it uses a normal browser FormData upload.
 */
export async function apiUpload<T>(path: string, options: UploadOptions): Promise<T> {
  const { file, fields = {}, fieldName = 'file' } = options;
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let status: number;
  let text: string;
  try {
    if (Platform.OS === 'web') {
      const form = new FormData();
      Object.entries(fields).forEach(([key, value]) => form.append(key, value));
      const blob = file.webFile ?? (await (await fetch(file.uri)).blob());
      form.append(fieldName, blob, file.name);

      const response = await fetch(url, { method: 'POST', headers, body: form });
      status = response.status;
      text = await response.text();
    } else {
      const localFile = new FsFile(file.uri);
      if (!localFile.exists) {
        throw new ApiError('This document is no longer available. Choose the file again before uploading.', 0);
      }
      const result = await localFile.upload(url, {
        httpMethod: 'POST',
        uploadType: UploadType.MULTIPART,
        fieldName,
        mimeType: file.mimeType,
        parameters: fields,
        headers,
      });
      status = result.status;
      text = result.body;
    }
  } catch (e) {
    console.warn(`[api] upload ${path} failed:`, e);
    if (e instanceof ApiError) throw e;
    if (e instanceof Error && /permission|not readable|no such file|does not exist/i.test(e.message)) {
      throw new ApiError('The app cannot read this document. Choose the file again; for a cloud document, download it to this phone first.', 0);
    }
    if (await serverIsReachable()) {
      throw new ApiError(
        'The server is running, but the upload failed. Choose the file again and retry, or try a smaller file.',
        0,
      );
    }
    throw new ApiError(
      `Cannot reach the server at ${API_BASE_URL}. Check that the backend is running and your phone is on the same Wi-Fi.`,
      0,
    );
  }

  return parseResponse<T>(status, text, true);
}
