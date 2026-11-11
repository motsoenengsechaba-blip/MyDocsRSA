import Constants from "expo-constants";

function resolveBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (override) {
    return override.replace(/\/+$/, "");
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri ? new URL(`http://${hostUri}`).hostname : "localhost";

  return `http://${host}:8080`;
}

export const API_BASE_URL = resolveBaseUrl();
