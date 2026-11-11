
import Constants from 'expo-constants';

/**
 * Backend configuration.
 * Production uses Render.
 * Local development can use EXPO_PUBLIC_API_URL to override it.
 */

const RENDER_API_URL = 'https://mydocsrsa-1.onrender.com';
const BACKEND_PORT = 8080;

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }

  // Use Render for installed production builds.
  if (!__DEV__) {
    return RENDER_API_URL;
  }

  // Local development fallback for Expo Go.
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : null;

  return `http://${host ?? 'localhost'}:${BACKEND_PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();
