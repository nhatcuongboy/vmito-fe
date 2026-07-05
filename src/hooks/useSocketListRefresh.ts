'use client';

import { useEffect, useRef } from 'react';

import { useSocket } from '@/contexts/SocketContext';

const DEFAULT_REFRESH_DELAY_MS = 1500;

/**
 * Subscribes to socket events and triggers a debounced refresh callback.
 *
 * Used by list pages to refetch their data when relevant realtime events
 * arrive on the user's room (e.g. registration requests for hosts, or
 * registration status updates for players), instead of showing stale data
 * until a manual reload.
 *
 * @param events - Socket event names to listen for. Pass a module-level
 *   constant so the subscription is not re-created on every render.
 * @param onRefresh - Callback invoked (debounced) when any event fires
 * @param delayMs - Debounce delay to coalesce bursts of events
 *
 * @example
 * ```tsx
 * const REFRESH_EVENTS = [SessionEventType.REGISTRATION_REQUEST];
 *
 * useSocketListRefresh(REFRESH_EVENTS, () => fetchSessions());
 * ```
 */
export const useSocketListRefresh = (
  events: readonly string[],
  onRefresh: () => void,
  delayMs: number = DEFAULT_REFRESH_DELAY_MS
) => {
  const { socket } = useSocket();

  // Keep the latest callback in a ref so socket listeners never go stale
  // and the subscription effect does not depend on the callback identity.
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!socket) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleEvent = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        onRefreshRef.current();
      }, delayMs);
    };

    events.forEach((event) => socket.on(event, handleEvent));

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => socket.off(event, handleEvent));
    };
    // `events` is expected to be a module-level constant (stable identity).
  }, [socket, delayMs, events]);
};
