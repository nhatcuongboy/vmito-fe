import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useTranslations } from 'next-intl';
import { useCourtCallStore } from '@/stores/useCourtCallStore';
import { useRouter } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { PlayerService } from '@/lib/api/player.service';
import { SessionService } from '@/lib/api/session.service';
import { REFRESH_INTERVALS } from '@/lib/constants';
import {
  sendSystemNotification,
  requestNotificationPermission,
} from '@/utils/notifications';
import { toaster } from '@/components/ui/toaster';
import {
  type Court,
  type Player,
  type ISession,
  type Match,
} from '@/lib/api/types';

interface UsePlayerSessionProps {
  mode: 'guest' | 'player';
  playerId?: string;
  joinCode?: string;
  sessionId?: string;
  userId?: string;
}

export function usePlayerSession({
  mode,
  playerId: propPlayerId,
  joinCode: propJoinCode,
  sessionId: propSessionId,
  userId,
}: UsePlayerSessionProps) {
  const t = useTranslations('pages.join.status');
  const router = useRouter();
  const { socket, joinSession, leaveSession } = useSocket();

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [session, setSession] = useState<ISession | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [currentCourt, setCurrentCourt] = useState<Court | null>(null);
  const [courtPlayers, setCourtPlayers] = useState<Player[]>([]);

  const showCourtCall = useCourtCallStore((s) => s.showCourtCall);

  // Function to fetch player data
  const fetchPlayerData = useCallback(
    async (isBackgroundRefresh = false) => {
      try {
        if (!isBackgroundRefresh) {
          setLoading(true);
          setError(null);
        }

        let playerData: Player | null = null;
        let sessionData: ISession | null = null;
        let sessionId: string | null = null;

        if (mode === 'guest') {
          if (!propPlayerId) {
            setError('MISSING_PLAYER_ID');
            return;
          }
          if (!propJoinCode) {
            setError('MISSING_JOIN_CODE');
            return;
          }

          const verification = await PlayerService.verifyPlayer(
            propPlayerId,
            propJoinCode
          );

          if (!verification.verified || !verification.session) {
            setError('INVALID_JOIN_CODE');
            return;
          }

          sessionId = verification.sessionId;
          sessionData = verification.session;

          useAuthStore
            .getState()
            .setGuestAuth(propPlayerId, sessionId, propJoinCode);

          playerData =
            sessionData.players?.find((p) => p.id === propPlayerId) || null;

          if (!playerData) {
            setError('PLAYER_NOT_FOUND');
            return;
          }

          if (!playerData.confirmedByPlayer && playerData.requireConfirmInfo) {
            router.push(`/join/confirm?playerId=${propPlayerId}`);
            return;
          }
        } else {
          if (!propSessionId) {
            setError('MISSING_SESSION_ID');
            return;
          }
          if (!userId) {
            setError('MISSING_USER_ID');
            return;
          }

          sessionId = propSessionId;
          sessionData = await SessionService.getSession(sessionId);

          if (!sessionData) {
            setError('SESSION_NOT_FOUND');
            return;
          }

          playerData =
            sessionData.players?.find((p) => p.userId === userId) || null;

          if (!playerData) {
            setError('PLAYER_NOT_IN_SESSION');
            return;
          }
        }

        setPlayer(playerData);
        setSession(sessionData);

        if (
          (playerData.status === 'PLAYING' || playerData.status === 'READY') &&
          playerData.currentCourtId
        ) {
          const court = sessionData.courts?.find(
            (c) => c.id === playerData.currentCourtId
          );
          if (court) {
            setCurrentCourt(court);
            setCourtPlayers(court.currentPlayers || []);
            setCurrentMatch(court.currentMatch || null);
          } else {
            setCurrentCourt(null);
            setCourtPlayers([]);
            setCurrentMatch(null);
          }
        } else {
          setCurrentMatch(null);
          setCurrentCourt(null);
          setCourtPlayers([]);
        }

        setError(null);
      } catch (error: unknown) {
        console.error('Error fetching player data:', error);
        const err = error as { response?: { status: number } };

        if (err.response?.status === 404) {
          if (!isBackgroundRefresh) {
            setError(
              mode === 'guest' ? 'PLAYER_NOT_FOUND' : 'SESSION_NOT_FOUND'
            );
          }
        } else {
          if (isBackgroundRefresh) {
            toaster.error({
              title: t('errors.refreshFailed') || 'Không thể cập nhật dữ liệu',
            });
          } else {
            setError('GENERAL_ERROR');
            toaster.error({ title: t('errors.loadFailed') });
          }
        }
      } finally {
        if (!isBackgroundRefresh) {
          setLoading(false);
        }
      }
    },
    [mode, propPlayerId, propJoinCode, propSessionId, userId, router, t]
  );

  // Socket.io integration
  useEffect(() => {
    if (session?.id) {
      joinSession(session.id);
      return () => leaveSession(session.id);
    }
  }, [session?.id, joinSession, leaveSession]);

  useEffect(() => {
    if (!socket || !session?.id) return;

    const handlePlayerCreated = (data: {
      sessionId: string;
      playerId: string;
    }) => {
      if (data.sessionId !== session.id) return;
      fetchPlayerData(true);
    };

    const handlePlayerUpdated = (data: {
      sessionId: string;
      playerId: string;
    }) => {
      if (data.sessionId !== session.id) return;
      if (data.playerId === player?.id) {
        const title = t('events.yourInfoUpdated');
        toaster.create({ title, type: 'info' });
        sendSystemNotification(title);
      }
      fetchPlayerData(true);
    };

    const handlePlayerRemoved = (data: {
      sessionId: string;
      playerId: string;
    }) => {
      if (data.sessionId !== session.id) return;
      if (data.playerId === player?.id) {
        const title = t('events.youWereRemoved');
        toaster.create({ title, type: 'warning' });
        sendSystemNotification(title);
      }
      fetchPlayerData(true);
    };

    const handlePlayersSelected = (data: {
      sessionId: string;
      courtId: string;
      playerIds?: string[];
    }) => {
      if (data.sessionId !== session.id) return;
      const isCurrentPlayerSelected = data.playerIds?.includes(
        player?.id || ''
      );

      if (isCurrentPlayerSelected) {
        const court = session.courts?.find((c) => c.id === data.courtId);
        const courtDisplayName = court
          ? court.courtName || t('court.title', { number: court.courtNumber })
          : t('court.title', { number: '?' });
        const courtNumber = court?.courtNumber;

        showCourtCall(courtDisplayName);

        sendSystemNotification(
          t('events.youWereSelected', { court: courtDisplayName }),
          t('courtCall.goToCourt') + ' ' + courtDisplayName
        );

        // TTS announcement in Vietnamese — repeat 3 times with a short pause
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const text = `Mời bạn vào sân số ${courtNumber ?? courtDisplayName}`;
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
      }
      fetchPlayerData(true);
    };

    const handlePlayersDeselected = (data: {
      sessionId: string;
      courtId: string;
      playerIds?: string[];
    }) => {
      if (data.sessionId !== session.id) return;
      const isCurrentPlayerDeselected = data.playerIds?.includes(
        player?.id || ''
      );

      if (isCurrentPlayerDeselected) {
        const court = session.courts?.find((c) => c.id === data.courtId);
        const courtName = court
          ? court.courtName || `Court ${court.courtNumber}`
          : 'Court';

        const title = t('events.youWereDeselected', { court: courtName });
        toaster.create({ title, type: 'info' });
        sendSystemNotification(title);
      }
      fetchPlayerData(true);
    };

    const handleGenericEvent = (data: { sessionId: string }) => {
      if (data.sessionId === session.id) {
        fetchPlayerData(true);
      }
    };

    socket.on('player_created', handlePlayerCreated);
    socket.on('player_updated', handlePlayerUpdated);
    socket.on('player_removed', handlePlayerRemoved);
    socket.on('players_selected', handlePlayersSelected);
    socket.on('players_deselected', handlePlayersDeselected);
    socket.on('session_updated', handleGenericEvent);
    socket.on('match_started', handleGenericEvent);
    socket.on('match_ended', handleGenericEvent);

    return () => {
      socket.off('player_created', handlePlayerCreated);
      socket.off('player_updated', handlePlayerUpdated);
      socket.off('player_removed', handlePlayerRemoved);
      socket.off('players_selected', handlePlayersSelected);
      socket.off('players_deselected', handlePlayersDeselected);
      socket.off('session_updated', handleGenericEvent);
      socket.off('match_started', handleGenericEvent);
      socket.off('match_ended', handleGenericEvent);
    };
  }, [socket, session?.id, session?.courts, player?.id, t, fetchPlayerData]);

  // Initial data fetch and auto-refresh
  useEffect(() => {
    if (mode === 'guest' && !propPlayerId) {
      setError('MISSING_PLAYER_ID');
      setLoading(false);
      return;
    }
    if (mode === 'player' && (!propSessionId || !userId)) {
      setError(propSessionId ? 'MISSING_USER_ID' : 'MISSING_SESSION_ID');
      setLoading(false);
      return;
    }
    fetchPlayerData(false);
  }, [propPlayerId, propSessionId, userId, mode, fetchPlayerData]);

  useEffect(() => {
    const timer = setInterval(() => {
      // Only refresh if tab is active
      if (!document.hidden) {
        fetchPlayerData(true);
      }
    }, REFRESH_INTERVALS.PLAYER * 1000); // Increased from 60s to 180s (3 minutes)
    return () => clearInterval(timer);
  }, [fetchPlayerData]);

  return {
    loading,
    error,
    player,
    session,
    currentMatch,
    currentCourt,
    courtPlayers,
    fetchPlayerData,
    setError,
  };
}
