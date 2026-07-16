'use client';

import { useEffect, useState } from 'react';

/**
 * Returns the current time at elapsed-minute boundaries, then every 60 seconds.
 * Pass undefined to keep the ticker idle.
 */
export function useElapsedMinuteTicker(startTimeMs?: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startTimeMs === undefined || !Number.isFinite(startTimeMs)) return;

    setNow(Date.now());
    let intervalId: number | undefined;
    const elapsedMs = Math.max(0, Date.now() - startTimeMs);
    const nextMinuteDelayMs = 60_000 - (elapsedMs % 60_000);
    const timeoutId = window.setTimeout(() => {
      setNow(Date.now());
      intervalId = window.setInterval(() => setNow(Date.now()), 60_000);
    }, nextMinuteDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [startTimeMs]);

  return now;
}
