import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthUser } from '@/context/AuthContext';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// SecureStore does not exist on the web, so the browser version uses localStorage.
async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveSession(token: string, user: AuthUser) {
  await setItem(TOKEN_KEY, token);
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function getToken() {
  return getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function clearSession() {
  // allSettled: if one delete fails the other still runs, and we never throw while signing out
  await Promise.allSettled([removeItem(TOKEN_KEY), removeItem(USER_KEY)]);
}

// ---- "Have I seen this person on this phone before?" ----
const RETURNING_KEY = 'returning_visitor';

export type ReturningInfo = { email: string; firstName: string };

export async function saveReturning(info: ReturningInfo) {
  await setItem(RETURNING_KEY, JSON.stringify(info));
}

/** Null on a brand-new install, so the sign-in screen can welcome a first-time visitor properly. */
export async function getReturning(): Promise<ReturningInfo | null> {
  const raw = await getItem(RETURNING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ReturningInfo;
  } catch {
    return null;
  }
}

// ---- The request statuses the person has already seen (to spot changes while they were away) ----
const seenKey = (userId: number) => `seen_statuses_${userId}`;

export async function getSeenStatuses(userId: number): Promise<Record<string, string> | null> {
  const key = seenKey(userId);
  const file = Platform.OS === 'web' ? null : new File(Paths.document, `${key}.json`);
  const raw = Platform.OS === 'web' ? localStorage.getItem(key) : file?.exists ? await file.text() : null;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
}

export async function saveSeenStatuses(userId: number, statuses: Record<string, string>) {
  const key = seenKey(userId);
  const content = JSON.stringify(statuses);
  if (Platform.OS === 'web') localStorage.setItem(key, content);
  else new File(Paths.document, `${key}.json`).write(content);
}
