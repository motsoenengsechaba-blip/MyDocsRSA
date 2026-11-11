import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError } from '@/lib/api';

/**
 * Loads data from the API when the screen opens, every time it comes back into focus,
 * and on pull-to-refresh. Pass a stable function (a module-level one such as fetchMyRequests).
 * With { intervalMs } it also quietly reloads on that interval while the screen is in focus,
 * so status changes appear without pulling down.
 */
export function useLoad<T>(loader: () => Promise<T>, options?: { intervalMs?: number }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true); // only true for the very first load
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  const run = useCallback(
    async (pullToRefresh: boolean) => {
      if (pullToRefresh) setRefreshing(true);
      try {
        setData(await loader());
        setError('');
        setSessionExpired(false);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
        setSessionExpired(e instanceof ApiError && e.status === 401);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loader],
  );

  const intervalMs = options?.intervalMs;

  useFocusEffect(
    useCallback(() => {
      run(false);
      const timer = intervalMs ? setInterval(() => run(false), intervalMs) : null;
      return () => {
        if (timer) clearInterval(timer);
      };
    }, [run, intervalMs]),
  );

  const refresh = useCallback(() => run(true), [run]);

  return { data, loading, refreshing, error, sessionExpired, refresh };
}
