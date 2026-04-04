'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useCourtCallStore } from '@/stores/useCourtCallStore';
import { INotification } from '@/lib/api/types';
import { sendSystemNotification } from '@/utils/notifications';

// Event types matching backend SessionEventType
export enum SessionEventType {
  SESSION_UPDATED = 'session_updated',
  PLAYER_CREATED = 'player_created',
  PLAYER_UPDATED = 'player_updated',
  PLAYER_REMOVED = 'player_removed',
  COURT_UPDATED = 'court_updated',
  MATCH_STARTED = 'match_started',
  MATCH_ENDED = 'match_ended',
  PLAYERS_SELECTED = 'players_selected',
  PLAYERS_DESELECTED = 'players_deselected',
  REGISTRATION_REQUEST = 'registration_request',
  REGISTRATION_STATUS_UPDATED = 'registration_status_updated',
  NOTIFICATION_RECEIVED = 'notification_received',
}

// All session-related event types for listening
export const ALL_SESSION_EVENTS = Object.values(SessionEventType);

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: Error | null;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
  joinSession: () => {},
  leaveSession: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    // Initialize socket connection
    // Use environment variable or default to localhost:3001
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Strip /api from the URL if it exists, as Socket.io works at the root path by default
    // and we use namespaces to separate concerns.
    const socketBaseUrl = apiUrl.endsWith('/api')
      ? apiUrl.slice(0, -4)
      : apiUrl;

    // Create socket instance with autoConnect: true
    // Namespace '/sessions' matches backend gateway namespace
    const socketInstance = io(`${socketBaseUrl}/sessions`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setConnectionError(err);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, []);

  // Join user room when user is authenticated
  useEffect(() => {
    if (socket && isConnected && user?.id) {
      // Join user specific room
      socket.emit('join_user_room', { userId: user.id });
      console.log(`[Socket] Joined user room: user-${user.id}`, {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    }
  }, [socket, isConnected, user?.id]);

  // Global event listeners for notifications
  useEffect(() => {
    if (!socket) return;

    // Listener for Registration Requests (Host)
    const handleRegistrationRequest = (data: any) => {
      toaster.success({
        title: 'New Registration Request',
        description: `${data.playerName} requested to join ${data.sessionName}`,
        duration: 5000,
      });
    };

    // Listener for Registration Status Updates (User)
    const handleStatusUpdate = (data: any) => {
      const isApproved = data.status === 'APPROVED';
      toaster.create({
        title: `Registration ${data.status}`,
        description: `Your registration for ${data.sessionName} has been ${data.status.toLowerCase()}`,
        type: isApproved ? 'success' : 'error',
        duration: 5000,
      });
    };

    // Listener for Real-time Notifications
    const handleNotificationReceived = (data: INotification) => {
      console.log('[Socket] Notification received:', {
        notificationId: data.id,
        userId: data.userId,
        currentUserId: user?.id,
        type: data.type,
        title: data.title,
      });

      // Security check: only process if it's for the current user
      if (data.userId !== user?.id) {
        console.warn(
          `[Socket] Received notification meant for user ${data.userId}, but current user is ${user?.id}`
        );
        return;
      }

      // Check for duplicate before adding (defensive check)
      const currentNotifications =
        useNotificationStore.getState().notifications;
      const isDuplicate = currentNotifications.some((n) => n.id === data.id);

      if (isDuplicate) {
        console.warn(
          `[Socket] Duplicate notification detected and blocked: ${data.id}`
        );
        return;
      }

      // Add to store (store also has its own deduplication)
      useNotificationStore.getState().addNotification(data);

      // Show toast notification
      toaster.info({
        title: data.title,
        description: data.message,
        duration: 5000,
      });
    };

    socket.on(SessionEventType.REGISTRATION_REQUEST, handleRegistrationRequest);
    socket.on(SessionEventType.REGISTRATION_STATUS_UPDATED, handleStatusUpdate);
    socket.on(
      SessionEventType.NOTIFICATION_RECEIVED,
      handleNotificationReceived
    );

    return () => {
      socket.off(
        SessionEventType.REGISTRATION_REQUEST,
        handleRegistrationRequest
      );
      socket.off(
        SessionEventType.REGISTRATION_STATUS_UPDATED,
        handleStatusUpdate
      );
      socket.off(
        SessionEventType.NOTIFICATION_RECEIVED,
        handleNotificationReceived
      );
    };
  }, [socket]);

  // Global listener for court-call (players_selected) via user room.
  // This fires even when the player is NOT on the session detail page.
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleGlobalPlayersSelected = (data: {
      sessionId: string;
      courtId: string;
      courtName?: string;
      courtNumber?: number;
      playerIds?: string[];
    }) => {
      const courtDisplayName =
        data.courtName || `Sân ${data.courtNumber ?? ''}`;

      // Show the global court-call modal
      useCourtCallStore.getState().showCourtCall(courtDisplayName);

      // System notification
      sendSystemNotification(
        `🏸 Đến lượt bạn! Vui lòng di chuyển đến ${courtDisplayName}`,
        `Trận đấu của bạn sắp bắt đầu.`
      );

      // TTS announcement — repeat 3 times
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const text = `Mời bạn vào sân số ${data.courtNumber ?? courtDisplayName}`;
        const speak = () => {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'vi-VN';
          u.rate = 1.0;
          return u;
        };
        const u1 = speak();
        const u2 = speak();
        const u3 = speak();
        u1.onend = () =>
          setTimeout(() => window.speechSynthesis.speak(u2), 1500);
        u2.onend = () =>
          setTimeout(() => window.speechSynthesis.speak(u3), 1500);
        window.speechSynthesis.speak(u1);
      }
    };

    socket.on(SessionEventType.PLAYERS_SELECTED, handleGlobalPlayersSelected);

    return () => {
      socket.off(
        SessionEventType.PLAYERS_SELECTED,
        handleGlobalPlayersSelected
      );
    };
  }, [socket, user?.id]);

  const joinSession = (sessionId: string) => {
    if (socket && isConnected) {
      socket.emit('joinSession', sessionId);
    }
  };

  const leaveSession = (sessionId: string) => {
    if (socket && isConnected) {
      socket.emit('leaveSession', sessionId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connectionError,
        joinSession,
        leaveSession,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
