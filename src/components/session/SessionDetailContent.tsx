'use client';

import { SessionService } from '@/lib/api/session.service';
import { Box, Container, Flex, Heading, Text } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Import compatibility components
import CourtsTab from '@/components/session/CourtsTab';
import PlayersTab, { PlayerFilter } from '@/components/session/PlayersTab';
import SessionHistoryList from '@/components/session/SessionHistoryList';
import SessionStatusHeader from '@/components/session/SessionStatusHeader';
import SettingsTab from '@/components/session/SettingsTab';
import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import MainLayout from '@/components/layout/MainLayout';
import { getCourtDisplayName } from '@/utils/session-helpers';
import { RefreshCw, Square, Trophy, Users, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import WaitTimeUpdater from './WaitTimeUpdater';
import SessionOverviewTab from './SessionOverviewTab';
import { CommonModal } from '@/components/ui/CommonModal';
// import AiAssistant from './AiAssistant';

// Types for session data and related entities
interface Player {
  id: string;
  playerNumber: number;
  name: string;
  gender?: string;
  level?: number;
  status: string;
  currentWaitTime: number;
  totalWaitTime: number;
  matchesPlayed: number;
  currentCourtId?: string;
  preFilledByHost: boolean;
  confirmedByPlayer: boolean;
  levelDescription?: string;
  requireConfirmInfo?: boolean;
}

interface Court {
  id: string;
  courtNumber: number;
  courtName?: string;
  status: string;
  currentMatchId?: string;
  currentPlayers: Player[];
  currentMatch?: Match;
}

interface MatchPlayer {
  id: string;
  matchId: string;
  playerId: string;
  position: number;
  player: Player;
}

interface Match {
  id: string;
  status: string;
  courtId: string;
  startTime: string;
  endTime?: string;
  players: MatchPlayer[];
}

interface SessionData {
  id: string;
  name: string;
  hostId: string;
  host: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  startTime: string | null;
  endTime: string | null;
  numberOfCourts: number;
  sessionDuration: number;
  maxPlayersPerCourt: number;
  requirePlayerInfo: boolean;
  players: Player[];
  courts: Court[];
  waitingQueue?: Player[];
}

export default function SessionDetailContent({
  sessionData,
}: {
  sessionData: SessionData;
}) {
  const t = useTranslations('SessionDetail');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionData>(sessionData);
  const [refreshInterval, setRefreshInterval] = useState<number>(60);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Initialize activeTab from URL parameter or default to 0
  const [activeTab, setActiveTab] = useState<number>(() => {
    const tabParam = searchParams.get('tab');
    const tabIndex = tabParam ? parseInt(tabParam, 10) : 0;
    return tabIndex >= 0 && tabIndex <= 3 ? tabIndex : 0;
  });
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [matchMode, setMatchMode] = useState<'auto' | 'manual'>('auto');
  const [showMatchCreation, setShowMatchCreation] = useState<boolean>(false);
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>('ALL');
  const [isToggleStatusLoading, setIsToggleStatusLoading] =
    useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<string>('');

  

  // Function to update URL with current tab
  const updateTabInURL = (tabIndex: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabIndex.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Function to handle tab change
  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    updateTabInURL(tabIndex);
  };

  // Get waiting players (players with status WAITING)
  const waitingPlayers = session.players
    .filter((player) => player.status === 'WAITING')
    .sort((a, b) => b.currentWaitTime - a.currentWaitTime);

  // Get active courts (with current matches)
  const activeCourts = session.courts
    .filter((court) => court.status === 'IN_USE')
    .map((court) => ({
      ...court,
      status: court.status as 'READY' | 'IN_USE' | 'EMPTY',
    }));

  // Helper function to get current match for a court
  const getCurrentMatch = (courtId: string): Match | null => {
    // Find the court first
    const court = session.courts.find((c) => c.id === courtId);

    // If court has a currentMatch, return it directly (more efficient than filtering all matches)
    // This optimization uses the currentMatch already included in the court data from API
    if (court?.currentMatch) {
      // Convert the currentMatch to our UI format (Date -> string)
      return {
        ...court.currentMatch,
        startTime: court.currentMatch.startTime
          ? new Date(court.currentMatch.startTime).toISOString()
          : new Date().toISOString(),
        endTime: court.currentMatch.endTime
          ? new Date(court.currentMatch.endTime).toISOString()
          : undefined,
      };
    }

    // Fallback: This should not be needed anymore since we're using court.currentMatch
    // but keeping for absolute backward compatibility
    return null;
  };

  // Function to refresh session data
  const refreshSessionData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      // Get complete session data including currentMatch in courts in a single API call
      // This replaces the previous approach of calling getSession() + getSessionMatches() separately
      const data = await SessionService.getSession(session.id);

      // Convert to SessionData format with proper typing
      setSession({
        ...data,
        players: (data.players || []).map((p: any) => ({
          ...p,
          name: p.name || '',
        })),
        courts: (data.courts || []).map((c: any) => ({
          ...c,
          currentPlayers: c.currentPlayers || [],
          // Convert currentMatch dates if present
          currentMatch: c.currentMatch
            ? {
                ...c.currentMatch,
                startTime: c.currentMatch.startTime
                  ? new Date(c.currentMatch.startTime).toISOString()
                  : new Date().toISOString(),
                endTime: c.currentMatch.endTime
                  ? new Date(c.currentMatch.endTime).toISOString()
                  : undefined,
              }
            : undefined,
        })),
        startTime: data.startTime
          ? new Date(data.startTime).toISOString()
          : null,
        endTime: data.endTime ? new Date(data.endTime).toISOString() : null,
      });
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error refreshing session data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [session.id]);

  // Setup auto-refresh when session is in progress
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (session.status === 'IN_PROGRESS' && refreshInterval > 0) {
      intervalId = setInterval(refreshSessionData, refreshInterval * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [session.status, refreshInterval, refreshSessionData]);

  // Toggle session status (Start/End session)
  const toggleSessionStatus = async () => {
    // Determine the next status
    let nextStatus = session.status;
    if (session.status === 'PREPARING') {
      nextStatus = 'IN_PROGRESS';
    } else if (session.status === 'IN_PROGRESS') {
      nextStatus = 'FINISHED';
    } else {
      return; // No change if already FINISHED
    }

    // Show confirmation dialog for ending session
    if (nextStatus === 'FINISHED') {
      setPendingAction('end');
      setShowConfirmDialog(true);
      return;
    }

    // Execute the status change directly for starting session
    await executeStatusChange(nextStatus);
  };

  // Execute the actual status change
  const executeStatusChange = async (nextStatus: string) => {
    try {
      setIsToggleStatusLoading(true);

      if (nextStatus === 'FINISHED') {
        // Use endSession API for comprehensive cleanup
        const result = await SessionService.endSession(session.id);

        // Update state with session data from endSession result
        setSession((prev) => ({
          ...prev,
          status: result.session.status,
          startTime: result.session.startTime
            ? new Date(result.session.startTime).toISOString()
            : null,
          endTime: result.session.endTime
            ? new Date(result.session.endTime).toISOString()
            : null,
        }));

        // Refresh session data to get updated players, courts, matches
        await refreshSessionData();
      } else {
        // For starting session, use updateSessionStatus
        const updatedSession = await SessionService.updateSessionStatus(
          session.id,
          nextStatus
        );

        // Update state with new data from server
        setSession((prev) => ({
          ...prev,
          status: updatedSession.status,
          startTime: updatedSession.startTime
            ? new Date(updatedSession.startTime).toISOString()
            : null,
          endTime: updatedSession.endTime
            ? new Date(updatedSession.endTime).toISOString()
            : null,
        }));
      }

      toaster.create({
        title:
          nextStatus === 'IN_PROGRESS'
            ? t('sessionStarted')
            : t('sessionEnded'),
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating session status:', error);
      toaster.create({
        title: t('errorUpdatingSessionStatus'),
        type: 'error',
        duration: 3000,
      });
    } finally {
      setIsToggleStatusLoading(false);
    }
  };

  // Handle confirmation dialog
  const handleConfirmAction = async () => {
    setShowConfirmDialog(false);
    if (pendingAction === 'end') {
      await executeStatusChange('FINISHED');
    }
    setPendingAction('');
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setPendingAction('');
  };

  // Format wait time to display in mm:ss format
  const formatWaitTime = (waitTimeInMinutes: number) => {
    const hours = Math.floor(waitTimeInMinutes / 60);
    const minutes = waitTimeInMinutes % 60;

    if (hours > 0) {
      return t('hoursMinutes', { hours, minutes });
    }

    return t('minutesShort', { minutes });
  };

  // Start manual match creation for a court
  const startManualMatchCreation = (courtId: string) => {
    setSelectedCourt(courtId);
    setMatchMode('manual');
    setShowMatchCreation(true);
    setSelectedPlayers([]);
  };

  return (
    <MainLayout
      title={t('title')}
      showBackButton={true}
      backHref="/host/sessions"
      contentPadding={0}
    >
      {/* Add WaitTimeUpdater to automatically update wait times every minute - only for IN_PROGRESS sessions */}
      <WaitTimeUpdater sessionId={session.id} sessionStatus={session.status} />
      
      {/* Session Status Bar - Full width, sticky below TopBar */}
      <SessionStatusHeader
        session={session}
        isRefreshing={isRefreshing}
        isToggleStatusLoading={isToggleStatusLoading}
        onToggleSessionStatus={toggleSessionStatus}
        onRefreshData={refreshSessionData}
      />

      <Container maxW="7xl" py={2}>
        {/* Tab Content Area */}
        <Box minH="60vh" pb="80px">
          {session.status !== 'IN_PROGRESS' && activeTab !== 0 && (
            <Text fontSize="lg" color="gray.500" textAlign="center" mt={4}>
              {session.status === 'PREPARING'
                ? t('courtsTab.startSessionToBeginMatches')
                : t('courtsTab.sessionHasEnded')}
            </Text>
          )}
          
          {activeTab === 0 && (
            <SessionOverviewTab session={session} />
          )}

          {activeTab === 1 && (
            <CourtsTab
              session={session}
              waitingPlayers={waitingPlayers}
              getCurrentMatch={getCurrentMatch}
              getCourtDisplayName={getCourtDisplayName}
              startManualMatchCreation={startManualMatchCreation}
              onDataRefresh={refreshSessionData}
              isRefreshing={isRefreshing}
              formatWaitTime={formatWaitTime}
              selectedPlayers={selectedPlayers}
            />
          )}

          {activeTab === 2 && (
            <PlayersTab
              sessionPlayers={session.players}
              playerFilter={playerFilter}
              setPlayerFilter={setPlayerFilter}
              formatWaitTime={formatWaitTime}
              sessionId={session.id}
              onPlayerUpdate={refreshSessionData}
            />
          )}

          {activeTab === 3 && (
            <SessionHistoryList
              sessionId={session.id}
              sessionData={{
                players: session.players,
                courts: session.courts,
              }}
            />
          )}

          {activeTab === 4 && (
            <SettingsTab
              session={session}
              refreshSessionData={refreshSessionData}
            />
          )}
        </Box>

        {/* Bottom Navigation Bar */}
        <Box
          position="fixed"
          left={0}
          right={0}
          bottom={0}
          zIndex={100}
          bg="white"
          borderTopWidth="1px"
          boxShadow="md"
          display="flex"
          justifyContent="space-around"
          alignItems="center"
          height="64px"
        >
          <Box
            as="button"
            flex={1}
            py={2}
            onClick={() => handleTabChange(0)}
            display="flex"
            flexDirection="column"
            alignItems="center"
            color={activeTab === 0 ? 'blue.500' : 'gray.500'}
            fontWeight={activeTab === 0 ? 'bold' : 'normal'}
          >
           <Box as={Info} boxSize={6} mb={1} />
            {t('overview')}
          </Box>
          <Box
            as="button"
            flex={1}
            py={2}
            onClick={() => handleTabChange(1)}
            display="flex"
            flexDirection="column"
            alignItems="center"
            color={activeTab === 1 ? 'blue.500' : 'gray.500'}
            fontWeight={activeTab === 1 ? 'bold' : 'normal'}
          >
            <Box as={Square} boxSize={6} mb={1} />
            {t('courts')}
          </Box>
          <Box
            as="button"
            flex={1}
            py={2}
            onClick={() => handleTabChange(2)}
            display="flex"
            flexDirection="column"
            alignItems="center"
            color={activeTab === 2 ? 'blue.500' : 'gray.500'}
            fontWeight={activeTab === 2 ? 'bold' : 'normal'}
          >
            <Box as={Users} boxSize={6} mb={1} />
            {t('players')}
          </Box>
          <Box
            as="button"
            flex={1}
            py={2}
            onClick={() => handleTabChange(3)}
            display="flex"
            flexDirection="column"
            alignItems="center"
            color={activeTab === 3 ? 'blue.500' : 'gray.500'}
            fontWeight={activeTab === 3 ? 'bold' : 'normal'}
          >
            <Box as={Trophy} boxSize={6} mb={1} />
            {t('matchs.tabTitle')}
          </Box>
          <Box
            as="button"
            flex={1}
            py={2}
            onClick={() => handleTabChange(4)}
            display="flex"
            flexDirection="column"
            alignItems="center"
            color={activeTab === 4 ? 'blue.500' : 'gray.500'}
            fontWeight={activeTab === 4 ? 'bold' : 'normal'}
          >
            <Box as={RefreshCw} boxSize={6} mb={1} />
            {t('settings')}
          </Box>
        </Box>
      </Container>

      {/* Confirmation Dialog */}
      <CommonModal
        isOpen={showConfirmDialog}
        onClose={handleCancelAction}
        title={t('confirmEndSession')}
        primaryActionText={t('endSession')}
        primaryColorScheme="red"
        onPrimaryAction={handleConfirmAction}
        isPrimaryLoading={isToggleStatusLoading}
        secondaryActionText={t('cancel')}
      >
        <Text color="gray.600" _dark={{ color: 'gray.300' }}>
          {t('confirmEndSessionMessage')}
        </Text>
      </CommonModal>

      {/* AI Assistant */}
      {/* <AiAssistant sessionId={session.id} /> */}
    </MainLayout>
  );
}
