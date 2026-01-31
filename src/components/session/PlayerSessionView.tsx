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
import {
  type Match,
  SessionStatus,
  RatingType,
  SessionRatingEligibility,
} from '@/lib/api/types';
import { getCourtDisplayName } from '@/utils/session-helpers';
import { PaymentInfoTab } from '@/components/payment';
import { PaymentService } from '@/lib/api/payment.service';
import { PaymentSettingsService } from '@/lib/api/payment-settings.service';
import { RatingService } from '@/lib/api/rating.service';
import { SubmitRatingModal, StarRatingDisplay } from '@/components/rating';
import type {
  PaymentRecord,
  HostPaymentSettings,
  PaymentMethod,
} from '@/lib/api/types';
import { Star, CheckCircle } from 'lucide-react';
import {
  Box,
  Center,
  Container,
  Flex,
  Heading,
  Spinner,
  Text,
  Button,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import {
  CONTAINER_PX,
  CONTENT_PT_OFFSET,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
} from '@/constants';

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

  const [activeTab, setActiveTab] = useState<number>(0); // 0: Overview, 1: Status, 2: Courts, 3: Results, 4: Payment

  // Payment state
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [hostPaymentSettings, setHostPaymentSettings] =
    useState<HostPaymentSettings | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<{
    type: 'not_implemented' | 'network_error' | 'unknown';
    message: string;
  } | null>(null);

  // Rating state
  const [ratingEligibility, setRatingEligibility] =
    useState<SessionRatingEligibility | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const ratingT = useTranslations('rating');

  // Fetch payment data
  const fetchPaymentData = async () => {
    if (!session?.id) return;

    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const [payments, settings] = await Promise.all([
        PaymentService.getMySessionPayments(session.id),
        session.hostId
          ? PaymentSettingsService.getHostPaymentSettings(session.hostId)
          : Promise.resolve(null),
      ]);
      setPaymentRecords(payments);
      setHostPaymentSettings(settings);
    } catch (error: unknown) {
      console.error('Failed to fetch payment data:', error);

      const err = error as {
        response?: { status?: number };
        statusCode?: number;
        message?: string;
      };

      // Detect 404 - backend not implemented
      if (err?.response?.status === 404 || err?.statusCode === 404) {
        setPaymentError({
          type: 'not_implemented',
          message:
            'Payment feature is not yet available on the backend. Please contact the administrator.',
        });
      } else if (
        err?.message?.includes('Network') ||
        err?.message?.includes('fetch')
      ) {
        setPaymentError({
          type: 'network_error',
          message: 'Network error. Please check your connection and try again.',
        });
      } else {
        setPaymentError({
          type: 'unknown',
          message: err?.message || 'Failed to load payment information.',
        });
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  // Fetch payment data when session changes or tab 4 is accessed
  useEffect(() => {
    if (session && activeTab === 4) {
      fetchPaymentData();
    }
  }, [session, activeTab]);

  // Fetch rating eligibility when session is finished
  const fetchRatingEligibility = async () => {
    if (!session?.id || session.status !== SessionStatus.FINISHED) return;

    setRatingLoading(true);
    try {
      const eligibility = await RatingService.getSessionRatingEligibility(
        session.id
      );
      setRatingEligibility(eligibility);
    } catch (error) {
      console.error('Failed to fetch rating eligibility:', error);
    } finally {
      setRatingLoading(false);
    }
  };

  useEffect(() => {
    if (session?.status === SessionStatus.FINISHED) {
      fetchRatingEligibility();
    }
  }, [session?.id, session?.status]);

  const handleRatingSuccess = () => {
    fetchRatingEligibility();
  };

  // Payment handlers
  const handleSubmitPayment = async (
    paymentId: string,
    data: {
      paymentMethod: PaymentMethod;
      proofImageUrl?: string;
      proofNotes?: string;
    }
  ) => {
    await PaymentService.submitPayment(paymentId, data);
    await fetchPaymentData(); // Refresh after submission
  };

  const handleUploadProof = async (file: File): Promise<string> => {
    return await PaymentService.uploadPaymentProof(file);
  };

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
        <Container
          maxW="md"
          py={12}
          px={CONTAINER_PX}
          pt={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
          }}
        >
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
        <Container
          maxW="md"
          py={12}
          px={CONTAINER_PX}
          pt={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
          }}
        >
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
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
          }}
          mt={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
          }}
        />
      )}

      <Container
        px={CONTAINER_PX}
        pt={4}
        pb={'calc(90px + env(safe-area-inset-bottom))'}
      >
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

                {/* Rate Host Section - Show when session is FINISHED */}
                {session.status === SessionStatus.FINISHED && (
                  <Box
                    mt={4}
                    p={6}
                    bg="white"
                    _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                    borderRadius="xl"
                    shadow="sm"
                    border="1px solid"
                    borderColor="gray.100"
                  >
                    <Flex align="center" justify="space-between">
                      <Flex align="center" gap={2}>
                        <Star size={20} color="#F6AD55" />
                        <Text fontWeight="semibold" color="gray.700">
                          {ratingT('rateHost')}
                        </Text>
                      </Flex>

                      {ratingLoading ? (
                        <Spinner size="sm" />
                      ) : ratingEligibility?.hasRatedHost &&
                        ratingEligibility?.hostRating ? (
                        <Flex align="center" gap={2}>
                          <CheckCircle size={16} color="#48BB78" />
                          <StarRatingDisplay
                            rating={ratingEligibility.hostRating.rating}
                            showCount={false}
                            size="sm"
                            variant="compact"
                          />
                        </Flex>
                      ) : ratingEligibility?.canRateHost ? (
                        <Button
                          size="sm"
                          colorPalette="orange"
                          onClick={() => setShowRatingModal(true)}
                        >
                          <Star size={14} />
                          {ratingT('rateHost')}
                        </Button>
                      ) : (
                        <Text fontSize="sm" color="gray.400">
                          {ratingT('cannotRate')}
                        </Text>
                      )}
                    </Flex>

                    {ratingEligibility?.hasRatedHost &&
                      ratingEligibility?.hostRating?.comment && (
                        <Text fontSize="sm" color="gray.500" mt={3} pl={7}>
                          "{ratingEligibility.hostRating.comment}"
                        </Text>
                      )}
                  </Box>
                )}

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

            {/* Payment Tab */}
            {activeTab === 4 && (
              <>
                {!session.feeConfig ? (
                  <Box p={6} bg="gray.50" borderRadius="lg" textAlign="center">
                    <Text color="gray.600">{sessionT('noFeeConfigured')}</Text>
                  </Box>
                ) : paymentLoading ? (
                  <Center py={8}>
                    <Spinner size="lg" color="blue.500" />
                  </Center>
                ) : paymentError ? (
                  <Box
                    p={6}
                    bg={
                      paymentError.type === 'not_implemented'
                        ? 'orange.50'
                        : 'red.50'
                    }
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={
                      paymentError.type === 'not_implemented'
                        ? 'orange.200'
                        : 'red.200'
                    }
                  >
                    <Heading
                      size="sm"
                      mb={2}
                      color={
                        paymentError.type === 'not_implemented'
                          ? 'orange.700'
                          : 'red.700'
                      }
                    >
                      {paymentError.type === 'not_implemented'
                        ? '⚠️ Feature Not Available'
                        : '❌ Error Loading Payment'}
                    </Heading>
                    <Text color="gray.700" mb={3}>
                      {paymentError.message}
                    </Text>
                    {paymentError.type !== 'not_implemented' && (
                      <Button
                        size="sm"
                        colorPalette="blue"
                        onClick={() => fetchPaymentData()}
                      >
                        Retry
                      </Button>
                    )}
                  </Box>
                ) : (
                  <PaymentInfoTab
                    session={session}
                    paymentRecords={paymentRecords}
                    hostPaymentSettings={hostPaymentSettings}
                    onSubmitPayment={handleSubmitPayment}
                    onUploadProof={handleUploadProof}
                  />
                )}
              </>
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

      {/* Rate Host Modal */}
      {session && (
        <SubmitRatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          sessionId={session.id}
          ratedUserId={session.hostId}
          ratedUserName={session.host?.name || session.hostName || 'Host'}
          ratedUserImage={undefined}
          type={RatingType.PLAYER_TO_HOST}
          onSuccess={handleRatingSuccess}
        />
      )}
    </>
  );
}
