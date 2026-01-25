'use client';

import { use, useState, useEffect } from 'react';
import { Spinner, Center, Box, Text, Container } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Info, RefreshCw, Square, Trophy, Users } from 'lucide-react';

// Hooks
import { useSessionData } from '@/hooks/useSessionData';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useAuthStore } from '@/stores/useAuthStore';

// Components
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import MainLayout from '@/components/layout/MainLayout';
import CourtsTab from '@/components/session/CourtsTab';
import PlayersTab, { PlayerFilter } from '@/components/session/PlayersTab';
import SessionHistoryList from '@/components/session/SessionHistoryList';
import SessionStatusHeader from '@/components/session/SessionStatusHeader';
import SettingsTab from '@/components/session/SettingsTab';
import SessionOverviewTab from '@/components/session/SessionOverviewTab';
import WaitTimeUpdater from '@/components/session/WaitTimeUpdater';
import BottomNavigationBar, {
  NavigationTab,
} from '@/components/ui/BottomNavigationBar';
import { CommonModal } from '@/components/ui/CommonModal';

// Types and Utils
import { UserRole, SessionStatus } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { getCourtDisplayName } from '@/utils/session-helpers';
import {
  getWaitingPlayers,
  getCurrentMatchForCourt,
  formatWaitTime as formatWaitTimeUtil,
} from '@/utils/session-utils';

/**
 * Host session page - displays detailed session management interface
 * Protected route requiring HOST or ADMIN role
 */
export default function HostSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations('SessionDetail');
  const { user } = useAuthStore();

  // Unwrap the params Promise to get session ID
  const unwrappedParams = use(params);
  const sessionId = unwrappedParams.id;

  // Fetch session data using custom hook
  const { session: initialSession, loading, error } = useSessionData(sessionId);

  // Local state for session data
  const [session, setSession] = useState(initialSession);

  // Sync local state with hook data when it changes
  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
    }
  }, [initialSession]);

  // State for match creation and player selection
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  // Store filter as array of statuses. Empty array means 'ALL'
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>([]);

  // Custom hooks
  const { activeTab, handleTabChange } = useTabNavigation();

  const { refreshSessionData, isRefreshing } = useSessionRefresh({
    sessionId: session?.id || sessionId,
    sessionStatus: session?.status || SessionStatus.PREPARING,
    onSessionUpdate: setSession,
  });

  const {
    isToggleStatusLoading,
    showConfirmDialog,
    toggleSessionStatus,
    handleConfirmAction,
    handleCancelAction,
  } = useSessionManagement({
    session: session!,
    onSessionUpdate: (updates) =>
      setSession((prev) => ({ ...prev!, ...updates })),
    onRefreshData: refreshSessionData,
    t,
    toaster,
  });

  // Define navigation tabs
  const allNavigationTabs: NavigationTab[] = [
    { id: 0, label: t('overview'), icon: Info },
    { id: 1, label: t('players'), icon: Users },
    { id: 2, label: t('courts'), icon: Square },
    { id: 3, label: t('matchs.tabTitle'), icon: Trophy },
    { id: 4, label: t('settings'), icon: RefreshCw },
  ];

  const navigationTabs = allNavigationTabs.filter((tab) => {
    if (user?.role === UserRole.PLAYER) {
      // Disable Courts (2) and Matches (3) for PLAYER
      return tab.id !== 2 && tab.id !== 3;
    }
    return true;
  });

  // Computed values using utility functions
  const waitingPlayers = session ? getWaitingPlayers(session.players) : [];
  const getCurrentMatch = (courtId: string) =>
    session ? getCurrentMatchForCourt(session.courts, courtId) : null;
  const formatWaitTime = (minutes: number) => formatWaitTimeUtil(minutes, t);

  // Start manual match creation for a court
  const startManualMatchCreation = (courtId: string) => {
    setSelectedPlayers([]);
  };

  // Loading state
  if (loading) {
    return (
      <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN, UserRole.PLAYER]}>
        <Center minH="50vh">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </ProtectedRouteGuard>
    );
  }

  // Error state
  if (error) {
    return (
      <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN, UserRole.PLAYER]}>
        <Box
          p={6}
          bg="red.50"
          color="red.600"
          borderRadius="md"
          m={8}
          textAlign="center"
        >
          <Text fontSize="lg" fontWeight="medium">
            {error}
          </Text>
          <Text mt={2}>
            Please try again or contact support if the problem persists.
          </Text>
        </Box>
      </ProtectedRouteGuard>
    );
  }

  // No session found
  if (!session) {
    return (
      <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN, UserRole.PLAYER]}>
        <Box
          p={6}
          bg="blue.50"
          color="blue.600"
          borderRadius="md"
          m={8}
          textAlign="center"
        >
          <Text fontSize="lg" fontWeight="medium">
            Session not found
          </Text>
          <Text mt={2}>
            The session you're looking for might have been deleted or doesn't
            exist.
          </Text>
        </Box>
      </ProtectedRouteGuard>
    );
  }

  // Render session detail content
  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN, UserRole.PLAYER]}>
      <MainLayout
        title={t('title')}
        showBackButton={true}
        backHref={user?.role === UserRole.PLAYER ? '/player/host' : '/host/sessions'}
        contentPadding={0}
      >
        {/* Auto-update wait times for IN_PROGRESS sessions */}
        <WaitTimeUpdater
          sessionId={session.id}
          sessionStatus={session.status}
        />

        {/* Session Status Header */}
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
            {session.status !== SessionStatus.IN_PROGRESS &&
              activeTab !== 0 && (
                <Text fontSize="lg" color="gray.500" textAlign="center" mt={4}>
                  {session.status === SessionStatus.PREPARING
                    ? t('courtsTab.startSessionToBeginMatches')
                    : t('courtsTab.sessionHasEnded')}
                </Text>
              )}

            {activeTab === 0 && (
              <SessionOverviewTab
                session={session}
                onToggleSessionStatus={toggleSessionStatus}
                isToggleStatusLoading={isToggleStatusLoading}
              />
            )}

            {activeTab === 1 && (
              <PlayersTab
                session={session}
                sessionPlayers={session.players}
                playerFilter={playerFilter}
                setPlayerFilter={setPlayerFilter}
                formatWaitTime={formatWaitTime}
                sessionId={session.id}
                onPlayerUpdate={refreshSessionData}
              />
            )}

            {activeTab === 2 && user?.role !== UserRole.PLAYER && (
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

            {activeTab === 3 && user?.role !== UserRole.PLAYER && (
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
          <BottomNavigationBar
            tabs={navigationTabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
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
      </MainLayout>
    </ProtectedRouteGuard>
  );
}
