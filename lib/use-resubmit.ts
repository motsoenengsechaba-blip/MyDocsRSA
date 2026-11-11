import { useState } from 'react';

import { resubmitRequest } from '@/lib/certification';
import { pickDocument, validateFile } from '@/lib/files';

/**
 * "Upload a corrected document" for a request an officer sent back: pick a file, check it,
 * upload it, then call onDone so the screen can reload.
 */
export function useResubmit(requestId: number, onDone: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function start() {
    setError('');
    try {
      const file = await pickDocument();
      if (!file) return;
      const problem = validateFile(file);
      if (problem) {
        setError(problem);
        return;
      }
      setBusy(true);
      await resubmitRequest(requestId, file);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not upload the file. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, start };
}
