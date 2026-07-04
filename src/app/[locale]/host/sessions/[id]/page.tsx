'use client';

import { use, useState, useEffect, Suspense } from 'react';
import { Spinner, Center, Box, Text, Flex } from '@chakra-ui/react';
import { useTranslations, useLocale } from 'next-intl';
import { Info, Square, Trophy, Users, DollarSign } from 'lucide-react';

// Hooks
import { useSessionData } from '@/hooks/useSessionData';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCanAccessHostFeatures } from '@/hooks/useCanAccessHostFeatures';

// Components
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import MainLayout from '@/components/layout/MainLayout';
import SessionCourtsTab from '@/components/session/SessionCourtsTab';
import SessionPlayersTab, {
  PlayerFilter,
} from '@/components/session/SessionPlayersTab';
import SessionMatchesTab from '@/components/session/SessionMatchesTab';
import SessionStatusHeader from '@/components/session/SessionStatusHeader';
import SessionOverviewTab from '@/components/session/SessionOverviewTab';
import SessionPaymentTab from '@/components/session/SessionPaymentTab';
import WaitTimeUpdater from '@/components/session/WaitTimeUpdater';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import {
  SessionCourtsTabSkeleton,
  SessionOverviewTabSkeleton,
  SessionPlayersTabSkeleton,
} from '@/components/session/SessionTabSkeletons';
import BottomNavigationBar, {
  NavigationTab,
} from '@/components/ui/BottomNavigationBar';
import { VModal } from '@/components/ui/VModal';
import { SessionService } from '@/lib/api/session.service';

// Types and Utils
import { UserRole, SessionStatus } from '@/lib/api/types';
import { REFRESH_INTERVALS } from '@/lib/constants';
import { toaster } from '@/components/ui/toaster';
import { useBottomNavVisibility } from '@/hooks/useBottomNavVisibility';
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
function HostSessionContent({ params }: { params: { id: string } }) {
  const t = useTranslations('SessionDetail');
  const tGuard = useTranslations('auth.guard');
  const { user } = useAuthStore();
  const { canAccessHostFeatures } = useCanAccessHostFeatures();
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

  // Only the session host (or an admin) may open the management page
  const isSessionOwner =
    !!session &&
    !!user &&
    (session.hostId === user.id || user.role === UserRole.ADMIN);

  // State for match creation and player selection
  const [selectedPlayers] = useState<string[]>([]);
  // Store filter as array of statuses. Empty array means 'ALL'
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>([]);

  // State for QR code modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedQrUrl, setSelectedQrUrl] = useState('');
  const [selectedQrLabel, setSelectedQrLabel] = useState('');
  const locale = useLocale();

  // Custom hooks
  const { activeTab, handleTabChange } = useTabNavigation();

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const isGlobalBottomNavVisible = useBottomNavVisibility();

  const { refreshSessionData, isRefreshing } = useSessionRefresh({
    sessionId: session?.id || sessionId,
    sessionStatus: session?.status || SessionStatus.PREPARING,
    onSessionUpdate: setSession,
    initialInterval: REFRESH_INTERVALS.HOST,
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
    { id: 1, label: t('playersTab.players'), icon: Users },
    { id: 2, label: t('courts'), icon: Square },
    { id: 3, label: t('matchs.tabTitle'), icon: Trophy },
    { id: 4, label: t('payment'), icon: DollarSign },
  ];

  const filteredOriginalTabs = allNavigationTabs.filter((tab) => {
    if (
      (user?.role === UserRole.PLAYER || user?.role === UserRole.REFEREE) &&
      !canAccessHostFeatures
    ) {
      // Disable Courts (2), Matches (3), and Payment (4) for non-VIP PLAYER/REFEREE
      return tab.id !== 2 && tab.id !== 3 && tab.id !== 4;
    }
    return true;
  });

  // Remap ids to sequential (0, 1, 2...) for BottomNavigationBar
  const navigationTabs = filteredOriginalTabs.map((tab, index) => ({
    ...tab,
    id: index,
  }));

  // Map sequential tab index → original content tab id
  const contentTabId = filteredOriginalTabs.map((tab) => tab.id);

  // Computed values using utility functions
  const waitingPlayers = session ? getWaitingPlayers(session.players) : [];
  const getCurrentMatch = (courtId: string) =>
    session ? getCurrentMatchForCourt(session.courts, courtId) : null;
  const formatWaitTime = (minutes: number) => formatWaitTimeUtil(minutes, t);

  const handleSaveNotes = async (notes: string) => {
    if (!session) return;

    const updatedSession = await SessionService.updateSession(session.id, {
      notes,
    });

    setSession((prev) =>
      prev
        ? {
            ...prev,
            notes: updatedSession.notes ?? notes,
          }
        : prev
    );
  };

  // Handle showing QR code for viewing session
  const handleShowQrView = () => {
    setSelectedQrUrl(`/${locale}/sessions/${session?.id}`);
    setSelectedQrLabel(t('qrScanToView'));
    setIsQrModalOpen(true);
  };

  // Handle showing QR code for joining session
  const handleShowQrJoin = () => {
    setSelectedQrUrl(`/${locale}/sessions/${session?.id}/join`);
    setSelectedQrLabel(t('qrScanToJoin'));
    setIsQrModalOpen(true);
  };

  const renderLoadingTabContent = () => {
    switch (contentTabId[activeTab]) {
      case 1:
        return <SessionPlayersTabSkeleton />;
      case 2:
        return <SessionCourtsTabSkeleton />;
      default:
        return <SessionOverviewTabSkeleton />;
    }
  };

  // Render session detail content
  return (
    <MainLayout
      title={t('title')}
      showBackButton={false}
      backHref="/host/sessions"
      contentPadding={0}
      centerTitle
    >
      {loading && !session ? (
        <Flex
          direction="column"
          align="center"
          py={2}
          w="full"
          px={{ base: 4, md: 8 }}
        >
          <Box minH="60vh" pb="160px" w="full" maxW="7xl">
            {renderLoadingTabContent()}
          </Box>

          <BottomNavigationBar
            tabs={navigationTabs}
            activeTab={activeTab}
            loadingTabId={activeTab}
            onTabChange={handleTabChange}
            alwaysVisible
            bottomOffset={
              isGlobalBottomNavVisible
                ? {
                    base: 'calc(64px + env(safe-area-inset-bottom))',
                    md: '0',
                  }
                : undefined
            }
          />
        </Flex>
      ) : error ? (
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
      ) : !session ? (
        <Box
          p={6}
          bg="blue.50"
          color="green.600"
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
      ) : !isSessionOwner ? (
        <Box
          p={6}
          bg="red.50"
          color="red.600"
          borderRadius="md"
          m={8}
          textAlign="center"
        >
          <Text fontSize="lg" fontWeight="medium">
            {tGuard('accessDenied')}
          </Text>
          <Text mt={2}>{tGuard('permissionDenied')}</Text>
        </Box>
      ) : (
        <>
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
            onShowQrView={handleShowQrView}
            onShowQrJoin={handleShowQrJoin}
            onSaveNotes={handleSaveNotes}
            showBackButton={true}
            backHref="/host/sessions"
          />

          <Flex
            direction="column"
            align="center"
            py={2}
            w="full"
            px={{ base: 4, md: 8 }}
          >
            {/* Tab Content Area */}
            <Box minH="60vh" pb="160px" w="full" maxW="7xl">
              {contentTabId[activeTab] === 0 && (
                <SessionOverviewTab
                  session={session}
                  onToggleSessionStatus={toggleSessionStatus}
                  isToggleStatusLoading={isToggleStatusLoading}
                  refreshSessionData={refreshSessionData}
                />
              )}

              {contentTabId[activeTab] === 1 && (
                <SessionPlayersTab
                  session={session}
                  sessionPlayers={session.players}
                  playerFilter={playerFilter}
                  setPlayerFilter={setPlayerFilter}
                  formatWaitTime={formatWaitTime}
                  sessionId={session.id}
                  onPlayerUpdate={refreshSessionData}
                  mode="manage"
                />
              )}

              {contentTabId[activeTab] === 2 && (
                <SessionCourtsTab
                  session={session}
                  waitingPlayers={waitingPlayers}
                  getCurrentMatch={getCurrentMatch}
                  getCourtDisplayName={getCourtDisplayName}
                  onDataRefresh={refreshSessionData}
                  isRefreshing={isRefreshing}
                  formatWaitTime={formatWaitTime}
                  selectedPlayers={selectedPlayers}
                />
              )}

              {contentTabId[activeTab] === 3 && (
                <SessionMatchesTab
                  sessionId={session.id}
                  sessionData={{
                    players: session.players,
                    courts: session.courts,
                  }}
                />
              )}

              {contentTabId[activeTab] === 4 && (
                <SessionPaymentTab session={session} />
              )}
            </Box>

            {/* Bottom Navigation Bar */}
            <BottomNavigationBar
              tabs={navigationTabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              alwaysVisible
              bottomOffset={
                isGlobalBottomNavVisible
                  ? {
                      base: 'calc(64px + env(safe-area-inset-bottom))',
                      md: '0',
                    }
                  : undefined
              }
            />
          </Flex>

          {/* Confirmation Dialog */}
          <VModal
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
          </VModal>

          {/* QR Code Modal */}
          <VModal
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
            title={selectedQrLabel}
            size="md"
          >
            <Flex justify="center" align="center" p={4} pb={8}>
              <QRCodeGenerator
                joinCode={session.id.slice(-8).toUpperCase()}
                size={300}
                url={selectedQrUrl}
                hideCode
                label={selectedQrLabel}
              />
            </Flex>
          </VModal>
        </>
      )}
    </MainLayout>
  );
}

export default function HostSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);

  return (
    <ProtectedRouteGuard
      requiredRole={[UserRole.HOST, UserRole.ADMIN, UserRole.PLAYER]}
    >
      <Suspense
        fallback={
          <Center minH="50vh">
            <Spinner size="xl" color="green.500" />
          </Center>
        }
      >
        <HostSessionContent params={unwrappedParams} />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
