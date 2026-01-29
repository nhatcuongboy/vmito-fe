'use client';

import { use, useState, useEffect, Suspense } from 'react';
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
import PlayerSessionView from '@/components/session/PlayerSessionView';

// Types and Utils
import { UserRole, SessionStatus } from '@/lib/api/types';
import { REFRESH_INTERVALS } from '@/lib/constants';
import { toaster } from '@/components/ui/toaster';
import { getCourtDisplayName } from '@/utils/session-helpers';
import {
  getWaitingPlayers,
  getCurrentMatchForCourt,
  formatWaitTime as formatWaitTimeUtil,
} from '@/utils/session-utils';

/**
 * Player session management page - displays detailed session management interface for PLAYER role
 * Protected route requiring PLAYER role
 */
function PlayerSessionManageContent({
  params,
}: {
  params: { id: string };
}) {
  const t = useTranslations('SessionDetail');
  const { user } = useAuthStore();
  const sessionId = params.id;

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
    initialInterval: REFRESH_INTERVALS.PLAYER,
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
  const navigationTabs: NavigationTab[] = [
    { id: 0, label: t('overview'), icon: Info },
    { id: 1, label: t('players'), icon: Users },
    { id: 2, label: t('courts'), icon: Square },
    { id: 3, label: t('matchs.tabTitle'), icon: Trophy },
    { id: 4, label: t('settings'), icon: RefreshCw },
  ];

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
      <ProtectedRouteGuard requiredRole={[UserRole.PLAYER, UserRole.HOST, UserRole.ADMIN]}>
        <Center minH="50vh">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </ProtectedRouteGuard>
    );
  }

  // Error state
  if (error) {
    return (
      <ProtectedRouteGuard requiredRole={[UserRole.PLAYER, UserRole.HOST, UserRole.ADMIN]}>
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
      <ProtectedRouteGuard requiredRole={[UserRole.PLAYER, UserRole.HOST, UserRole.ADMIN]}>
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

  // Check ownership: if not owner, render view mode
  if (session.hostId !== user?.id) {
    return (
      <ProtectedRouteGuard requiredRole={[UserRole.PLAYER, UserRole.HOST, UserRole.ADMIN]}>
        <PlayerSessionView
          mode="player"
          sessionId={sessionId}
          userId={user?.id}
          errorRedirectPath="/player/dashboard"
        />
      </ProtectedRouteGuard>
    );
  }

  // Render session detail content for owner
  return (
    <MainLayout
      title={t('title')}
      showBackButton={true}
      backHref="/player/sessions"
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

          {activeTab === 2 && (
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
  );
}

export default function PlayerSessionManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.PLAYER, UserRole.HOST, UserRole.ADMIN]}>
      <Suspense fallback={<Center minH="50vh"><Spinner size="xl" color="blue.500" /></Center>}>
        <PlayerSessionManageContent params={unwrappedParams} />
      </Suspense>
    </ProtectedRouteGuard>
  );
}

