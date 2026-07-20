'use client';

import { useCallback, useState } from 'react';

/**
 * Drives a confirmation dialog: holds the pending target, the in-flight state,
 * and the failure message.
 *
 * On failure the target is kept so the dialog stays open with the reason
 * visible; on success it clears and the dialog closes.
 */
export function useConfirmAction<TTarget>() {
  const [target, setTarget] = useState<TTarget | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');

  const request = useCallback((next: TTarget) => {
    setError('');
    setTarget(next);
  }, []);

  const close = useCallback(() => {
    setTarget(null);
    setError('');
  }, []);

  const run = useCallback(
    async (
      action: (target: TTarget) => Promise<void>,
      fallbackError: string
    ) => {
      if (target === null) return;
      setIsRunning(true);
      setError('');
      try {
        await action(target);
        setTarget(null);
      } catch (caught) {
        setError(
          caught instanceof Error && caught.message
            ? caught.message
            : fallbackError
        );
      } finally {
        setIsRunning(false);
      }
    },
    [target]
  );

  return { target, isRunning, error, request, close, run };
}

export default useConfirmAction;
