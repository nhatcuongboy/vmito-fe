'use client';

import CourtCallModal from '@/components/session/CourtCallModal';
import CourtsTab from '@/components/session/CourtsTab';
import PlayerSessionBottomNav from '@/components/session/PlayerSessionBottomNav';
import PlayerStatusTab from '@/components/session/PlayerStatusTab';
import PlayerMatchHistory from '@/components/session/PlayerMatchHistory';
import SessionInfo from '@/components/session/SessionInfo';
import OverviewPlayerTable from '@/components/session/OverviewPlayerTable';
import SessionStatusHeader from '@/components/session/SessionStatusHeader';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import TopBar from '@/components/ui/TopBar';
import { usePlayerSession } from '@/hooks/usePlayerSession';
import { type Match } from '@/lib/api/types';
import { getCourtDisplayName } from '@/utils/session-helpers';
import {
  Box,
  Center,
  Container,
  Flex,
  Heading,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export interface PlayerSessionViewProps {
  /**
   * Mode to determine how to fetch player data:
   * - 'guest': Use playerId directly (for GUEST role)
   * - 'player': Use sessionId + userId to find player (for PLAYER role)
   */
  mode: 'guest' | 'player';
  /**
   * Player ID - required when mode is 'guest'
   */
  playerId?: string;
  /**
   * Join code - required when mode is 'guest' for verification
   */
  playerIdSuffix?: string; // Not used but kept for interface consistency if needed
  joinCode?: string;
  /**
   * Session ID - required when mode is 'player'
   */
  sessionId?: string;
  /**
   * User ID - required when mode is 'player' to find player in session
   */
  userId?: string;
  /**
   * Error redirect path
   */
  errorRedirectPath?: string;
}

export default function PlayerSessionView({
  mode,
  playerId: propPlayerId,
  joinCode: propJoinCode,
  sessionId: propSessionId,
  userId,
  errorRedirectPath = '/join',
}: PlayerSessionViewProps) {
  const t = useTranslations('pages.join.status');
  const sessionT = useTranslations('SessionDetail');
  const common = useTranslations('common');

  const {
    loading,
    error,
    player,
    session,
    currentMatch,
    currentCourt,
    courtPlayers,
    courtCallModalOpen,
    courtCallCourtName,
    setCourtCallModalOpen,
    fetchPlayerData,
  } = usePlayerSession({
    mode,
    playerId: propPlayerId,
    joinCode: propJoinCode,
    sessionId: propSessionId,
    userId,
  });

  const [activeTab, setActiveTab] = useState<number>(0); // 0: Overview, 1: Status, 2: Courts, 3: Results

  // Helper function to format elapsed time for match display
  const formatMatchElapsedTime = (startTime: Date | string): string => {
    const start = new Date(startTime);
    const elapsedMs = Date.now() - start.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    if (elapsedMinutes === 0) {
      return t('time.lessThanMinute');
    } else if (elapsedMinutes === 1) {
      return t('time.oneMinute');
    } else {
      return t('time.minutes', { count: elapsedMinutes });
    }
  };

  // Helper function to get current match for a court
  const getCurrentMatch = (courtId: string): Match | null => {
    const courtData = session?.courts?.find((c) => c.id === courtId);
    const match = courtData?.currentMatch;
    if (!match) return null;
    return match;
  };

  // Format wait time to display in mm:ss format
  const formatWaitTime = (waitTimeInMinutes: number) => {
    const hours = Math.floor(waitTimeInMinutes / 60);
    const minutes = waitTimeInMinutes % 60;

    if (hours > 0) {
      return `${hours}h${minutes}m`;
    }

    return `${minutes} min`;
  };

  // Helper function to get waiting players
  const getWaitingPlayers = () => {
    return session?.players?.filter((p) => p.status === 'WAITING') || [];
  };

  // Get error message based on error type
  const getErrorMessage = () => {
    switch (error) {
      case 'MISSING_PLAYER_ID':
        return {
          title: t('errors.missingPlayerId'),
          description: t('errors.missingPlayerIdDescription'),
        };
      case 'MISSING_JOIN_CODE':
        return {
          title: t('errors.missingJoinCode'),
          description: t('errors.missingJoinCodeDescription'),
        };
      case 'INVALID_JOIN_CODE':
        return {
          title: t('errors.invalidJoinCode'),
          description: t('errors.invalidJoinCodeDescription'),
        };
      case 'MISSING_SESSION_ID':
        return {
          title: 'Session ID không hợp lệ',
          description: 'Không tìm thấy thông tin session.',
        };
      case 'MISSING_USER_ID':
        return {
          title: 'Không tìm thấy thông tin người dùng',
          description: 'Vui lòng đăng nhập lại.',
        };
      case 'PLAYER_NOT_FOUND':
        return {
          title: t('errors.playerNotFound'),
          description: t('errors.playerNotFoundDescription'),
        };
      case 'SESSION_NOT_FOUND':
        return {
          title: 'Session không tồn tại',
          description: 'Session này không tồn tại hoặc đã bị xóa.',
        };
      case 'PLAYER_NOT_IN_SESSION':
        return {
          title: 'Bạn chưa tham gia session này',
          description:
            'Bạn cần được thêm vào session bởi Host để xem thông tin.',
        };
      default:
        return {
          title: t('errors.loadFailed'),
          description: t('errors.generalErrorDescription'),
        };
    }
  };

  if (loading && !player) {
    return (
      <>
        <TopBar title={t('title')} />
        <Container maxW="md" py={12} pt="70px">
          <Flex
            justify="center"
            align="center"
            height="50vh"
            direction="column"
          >
            <Spinner size="xl" color="blue.500" mb={4} />
            <Text>{common('loading')}</Text>
          </Flex>
        </Container>
      </>
    );
  }

  if (error || (!loading && (!player || !session))) {
    const errorMessage = getErrorMessage();
    return (
      <>
        <TopBar title={t('title')} />
        <Container maxW="md" py={12} pt="70px">
          <Flex
            justify="center"
            align="center"
            height="50vh"
            direction="column"
          >
            <Box
              as="div"
              p={5}
              borderRadius="md"
              bg="red.50"
              color="red.500"
              mb={4}
              textAlign="center"
            >
              <Heading size="md" mb={2}>
                {errorMessage.title}
              </Heading>
              <Text>{errorMessage.description}</Text>
            </Box>
            <Flex gap={3}>
              <NextLinkButton href={errorRedirectPath} colorPalette="blue">
                {mode === 'guest'
                  ? t('errors.returnToJoin')
                  : 'Quay lại Dashboard'}
              </NextLinkButton>
              {error === 'GENERAL_ERROR' && (
                <NextLinkButton
                  href="#"
                  variant="outline"
                  colorPalette="blue"
                  onClick={(e) => {
                    e.preventDefault();
                    fetchPlayerData(false);
                  }}
                >
                  {common('retry')}
                </NextLinkButton>
              )}
            </Flex>
          </Flex>
        </Container>
      </>
    );
  }

  return (
    <>
      <TopBar title={t('title')} showBackButton={mode !== 'guest'} />

      {session && (
        <SessionStatusHeader
          session={{
            name: session.name,
            status: session.status,
          }}
          readOnly
          stickyTop={{
            base: 'calc(44px + env(safe-area-inset-top))',
            md: 'calc(56px + env(safe-area-inset-top))',
          }}
          mt={{
            base: 'calc(44px + env(safe-area-inset-top))',
            md: 'calc(56px + env(safe-area-inset-top))',
          }}
        />
      )}

      <Container pt={4} pb={'calc(90px + env(safe-area-inset-bottom))'}>
        {/* Tab Content */}
        {!player || !session ? (
          <Center>
            <Spinner size="xl" />
          </Center>
        ) : (
          <Box minH="60vh">
            {/* Overview Tab */}
            {activeTab === 0 && (
              <>
                <Box
                  p={6}
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="xl"
                  shadow="sm"
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="gray.500"
                    mb={4}
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    {sessionT('information')}
                  </Text>
                  <SessionInfo session={session} player={player} />
                </Box>
                <OverviewPlayerTable players={session.players || []} />
              </>
            )}

            {/* Status Tab */}
            {activeTab === 1 && (
              <PlayerStatusTab
                player={player}
                currentCourt={currentCourt}
                currentMatch={currentMatch}
                courtPlayers={courtPlayers}
                formatMatchElapsedTime={formatMatchElapsedTime}
                sessionId={session.id}
              />
            )}

            {/* Courts Tab */}
            {activeTab === 2 && (
              <CourtsTab
                session={session}
                waitingPlayers={getWaitingPlayers()}
                getCurrentMatch={getCurrentMatch}
                getCourtDisplayName={getCourtDisplayName}
                onDataRefresh={() => fetchPlayerData(true)}
                mode="view"
                formatWaitTime={formatWaitTime}
                selectedPlayers={[]}
              />
            )}

            {/* Results Tab */}
            {activeTab === 3 && (
              <PlayerMatchHistory sessionId={session.id} playerId={player.id} />
            )}
          </Box>
        )}

        {/* Bottom Navigation Bar */}
        <PlayerSessionBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </Container>

      {/* Court Call Modal */}
      <CourtCallModal
        isOpen={courtCallModalOpen}
        onClose={() => setCourtCallModalOpen(false)}
        courtName={courtCallCourtName}
      />
    </>
  );
}
