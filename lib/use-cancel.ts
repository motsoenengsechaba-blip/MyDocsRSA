import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { ApiError } from '@/lib/api';
import { cancelRequest } from '@/lib/certification';
import { cancelKind, type RequestStatus } from '@/lib/types';

function confirm(title: string, message: string, confirmLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve((globalThis as any).confirm?.(`${title}\n\n${message}`) ?? false);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Keep it', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/**
 * Cancel (or remove) a request the person made, after asking "are you sure?".
 * `kind` is null when it is no longer possible, e.g. an officer is already reviewing it.
 */
export function useCancel(request: { requestId: number; status: RequestStatus }, onDone: () => void) {
  const kind = cancelKind(request.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function start() {
    if (!kind) return;
    setError('');
    const ok =
      kind === 'cancel'
        ? await confirm(
            'Cancel this request?',
            'Your document will be withdrawn and no officer will review it. You can submit it again later.',
            'Cancel request',
          )
        : await confirm('Remove this request?', 'It will be taken off your list.', 'Remove');
    if (!ok) return;

    setBusy(true);
    try {
      await cancelRequest(request.requestId);
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not do that. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return { kind, busy, error, start, label: kind === 'remove' ? 'Remove from my list' : 'Cancel request' };
}
