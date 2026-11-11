import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { fetchMyRequests } from '@/lib/certification';
import { getSeenStatuses, saveSeenStatuses } from '@/lib/storage';
import { requestTitle, type CertificationRequest, type RequestStatus } from '@/lib/types';

export type StatusUpdate = {
  requestId: number;
  title: string;
  from: RequestStatus;
  to: RequestStatus;
  notes: string | null;
};

/** How a status reads in a sentence: "Your ID document is now ...". */
export const STATUS_PHRASE: Record<RequestStatus, string> = {
  SUBMITTED: 'pending',
  UNDER_REVIEW: 'in review',
  INVESTIGATION_REQUIRED: 'in review',
  APPROVED: 'verified',
  REJECTED: 'rejected',
  RESUBMISSION_REQUIRED: 'waiting for a corrected copy',
};

type Value = {
  /** Requests whose status changed since the person last looked at them. */
  updates: StatusUpdate[];
  /** Mark one request (or, with no argument, all of them) as seen. */
  acknowledge: (requestId?: number) => void;
};

const StatusUpdatesContext = createContext<Value>({ updates: [], acknowledge: () => {} });

const POLL_MS = 25000;

/**
 * Watches the person's requests in the background (every 25 seconds, and whenever the app
 * comes back to the front) and remembers which statuses they have already seen. When an officer
 * changes one, it shows up here, even if the change happened while the app was closed.
 */
export function StatusUpdatesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.userId;
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);
  const seen = useRef<Record<string, string> | null>(null); // last status the person has seen, per request
  const latest = useRef<CertificationRequest[]>([]);
  const checking = useRef(false);

  const check = useCallback(async () => {
    if (userId === undefined || checking.current) return;
    checking.current = true;
    try {
      const list = await fetchMyRequests();
      latest.current = list;

      let map = seen.current;
      let dirty = false;
      if (map === null) {
        const stored = await getSeenStatuses(userId);
        map = stored ?? {};
        if (!stored) {
          // Very first run on this phone: everything that exists now counts as already seen
          for (const r of list) map[String(r.requestId)] = r.status;
          dirty = true;
        }
        seen.current = map;
      }

      const found: StatusUpdate[] = [];
      const ids = new Set(list.map((r) => String(r.requestId)));
      for (const r of list) {
        const key = String(r.requestId);
        const before = map[key];
        if (before === undefined) {
          map[key] = r.status; // a request the person just made
          dirty = true;
        } else if (before !== r.status) {
          found.push({ requestId: r.requestId, title: requestTitle(r), from: before as RequestStatus, to: r.status, notes: r.notes });
        }
      }
      for (const key of Object.keys(map)) {
        if (!ids.has(key)) {
          delete map[key]; // cancelled or removed
          dirty = true;
        }
      }

      setUpdates(found);
      if (dirty) await saveSeenStatuses(userId, map);
    } catch {
      // Quiet on purpose: the screens show their own load errors
    } finally { checking.current = false; }
  }, [userId]);

  useEffect(() => {
    seen.current = null;
    const initial = setTimeout(check, 0);
    const timer = setInterval(check, POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      sub.remove();
    };
  }, [check]);

  const acknowledge = useCallback(
    (requestId?: number) => {
      const map = seen.current;
      if (!map || userId === undefined) return;
      const targets = requestId === undefined ? latest.current : latest.current.filter((r) => r.requestId === requestId);
      let dirty = false;
      for (const r of targets) {
        if (map[String(r.requestId)] !== r.status) {
          map[String(r.requestId)] = r.status;
          dirty = true;
        }
      }
      if (dirty) saveSeenStatuses(userId, map).catch(() => {});
      setUpdates((prev) => (requestId === undefined ? [] : prev.filter((u) => u.requestId !== requestId)));
    },
    [userId],
  );

  const value = useMemo(() => ({ updates, acknowledge }), [updates, acknowledge]);
  return <StatusUpdatesContext.Provider value={value}>{children}</StatusUpdatesContext.Provider>;
}

export function useStatusUpdates() {
  return useContext(StatusUpdatesContext);
}
