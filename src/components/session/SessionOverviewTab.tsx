'use client';

import { useState } from 'react';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { Button, IconButton, SimpleGrid } from '@/components/ui/chakra-compat';
import { VDrawer } from '@/components/ui/VDrawer';
import { VModal } from '@/components/ui/VModal';
import { ISession, Player, SessionStatus } from '@/lib/api/types';
import AppImageGallery from '@/components/session/AppImageGallery';
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Icon,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  Activity,
  CheckCircle,
  Clock,
  Pencil,
  Play,
  Square,
  Users,
  XCircle,
  AlertTriangle,
  Download,
  Info,
  Share2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import SessionInfo from './SessionInfo';
import SessionEditForm from './SessionEditForm';
import SessionPlayers from './SessionPlayers';
import SessionShareImageModal from './SessionShareImageModal';
import { RatePlayersSection } from '@/components/rating';
import { postsService } from '@/lib/api/posts.service';
import { toaster } from '@/components/ui/toaster';

interface SessionOverviewTabProps {
  session: ISession;
  onToggleSessionStatus?: () => void;
  onCancelSession?: () => void;
  isToggleStatusLoading?: boolean;
  isOvertime?: boolean;
  refreshSessionData?: () => void;
}

export default function SessionOverviewTab({
  session,
  onToggleSessionStatus,
  onCancelSession,
  isToggleStatusLoading,
  isOvertime = false,
  refreshSessionData,
}: SessionOverviewTabProps) {
  const t = useTranslations('SessionDetail');
  const tSession = useTranslations('session');
  const locale = useLocale();
  const shouldUseCompactInfo =
    useBreakpointValue({ base: true, md: false }, { ssr: false }) ?? true;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedQrUrl, setSelectedQrUrl] = useState('');
  const [selectedQrLabel, setSelectedQrLabel] = useState('');
  const [isShareImageModalOpen, setIsShareImageModalOpen] = useState(false);
  const [isRankingInfoOpen, setIsRankingInfoOpen] = useState(false);
  const [isShareResultsConfirmOpen, setIsShareResultsConfirmOpen] =
    useState(false);
  const [isSharingResults, setIsSharingResults] = useState(false);

  const handleShareResults = async () => {
    setIsSharingResults(true);
    try {
      await postsService.shareSessionResults(session.id);
      setIsShareResultsConfirmOpen(false);
      toaster.create({
        title: t('shareResultsSuccess'),
        type: 'success',
      });
    } catch (error: unknown) {
      setIsShareResultsConfirmOpen(false);
      const data = (
        error as {
          response?: {
            data?: { message?: string; error?: { message?: string } };
          };
        }
      )?.response?.data;
      toaster.create({
        title: data?.error?.message || data?.message || t('shareResultsError'),
        type: 'error',
      });
    } finally {
      setIsSharingResults(false);
    }
  };

  const handleQrClick = (url: string, label: string) => {
    setSelectedQrUrl(url);
    setSelectedQrLabel(label);
    setIsQrModalOpen(true);
  };

  const joinCode = session.id.slice(-8).toUpperCase();

  const totalPlayers = session.players?.length || 0;
  const maleCount =
    session.players?.filter((p: Player) => p.gender === 'MALE').length || 0;
  const femaleCount =
    session.players?.filter((p: Player) => p.gender === 'FEMALE').length || 0;
  const waitingPlayers =
    session.players?.filter((p: Player) => p.status === 'WAITING').length || 0;
  const playingPlayers =
    session.players?.filter((p: Player) => p.status === 'PLAYING').length || 0;
  const readyPlayers =
    session.players?.filter((p: Player) => p.status === 'READY').length || 0;
  const maxPlayers = session.numberOfCourts * (session.maxPlayersPerCourt || 4);
  const fillPercent =
    maxPlayers > 0 ? Math.round((totalPlayers / maxPlayers) * 100) : 0;

  return (
    <Box>
      {/* Overtime Banner */}
      {isOvertime && session.status === SessionStatus.IN_PROGRESS && (
        <Box
          mb={4}
          p={4}
          bg="orange.50"
          _dark={{ bg: 'orange.900/20', borderColor: 'orange.800' }}
          borderRadius="xl"
          border="1px solid"
          borderColor="orange.200"
        >
          <Flex align="center" gap={3}>
            <Box as={AlertTriangle} boxSize={5} color="orange.500" />
            <Box>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="orange.700"
                _dark={{ color: 'orange.300' }}
              >
                {t('overtimeTitle')}
              </Text>
              <Text
                fontSize="xs"
                color="orange.600"
                _dark={{ color: 'orange.400' }}
              >
                {t('overtimeMessage')}
              </Text>
            </Box>
          </Flex>
        </Box>
      )}

      {/* Cancelled Banner */}
      {session.status === SessionStatus.CANCELLED && (
        <Box
          mb={4}
          p={4}
          bg="gray.50"
          _dark={{ bg: 'gray.900/20', borderColor: 'gray.700' }}
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <Flex align="center" gap={3}>
            <Box as={XCircle} boxSize={5} color="gray.500" />
            <Box>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="gray.700"
                _dark={{ color: 'gray.300' }}
              >
                {t('cancelledTitle')}
              </Text>
              <Text
                fontSize="xs"
                color="gray.600"
                _dark={{ color: 'gray.400' }}
              >
                {t('cancelledMessage')}
              </Text>
            </Box>
          </Flex>
        </Box>
      )}

      {/* Cover Photo / Image Gallery Section */}
      {(session.coverPhoto ||
        (session.images && session.images.length > 0)) && (
        <AppImageGallery
          images={session.images || []}
          coverPhoto={session.coverPhoto}
          alt={session.name}
        />
      )}

      <Grid
        templateColumns={{ base: '1fr', md: '3fr 2fr' }}
        gap={{ base: 4, md: 8 }}
        mb={{ base: 4, md: 8 }}
      >
        {/* Left Column: Session Info */}
        <Box as="section" h="full">
          <Box
            p={6}
            bg={{ base: 'white', _dark: 'gray.800' }}
            _dark={{ borderColor: 'gray.700' }}
            borderRadius="xl"
            shadow="sm"
            border="1px solid"
            borderColor="gray.100"
            h="full"
          >
            <Flex align="center" justify="space-between" mb={4}>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {t('information')}
              </Text>
              <Button
                size="xs"
                variant="outline"
                colorPalette="green"
                onClick={() => setIsEditModalOpen(true)}
                leftIcon={<Pencil size={13} />}
              >
                {t('edit')}
              </Button>
            </Flex>

            {(() => {
              let isExpired = false;
              if (session.status === 'PREPARING') {
                if (session.endTime) {
                  isExpired = new Date(session.endTime) < new Date();
                } else if (session.startTime) {
                  const computed = new Date(session.startTime);
                  computed.setMinutes(
                    computed.getMinutes() + (session.sessionDuration || 120)
                  );
                  isExpired = computed < new Date();
                }
              }
              return (
                isExpired && (
                  <Box
                    mb={4}
                    p={3}
                    bg="orange.50"
                    _dark={{ bg: 'orange.900/30' }}
                    borderRadius="md"
                  >
                    <Text
                      fontSize="sm"
                      color="orange.800"
                      _dark={{ color: 'orange.200' }}
                      fontWeight="medium"
                    >
                      {t('pastEndWarning')}
                    </Text>
                  </Box>
                )
              );
            })()}

            <SessionInfo
              session={session}
              compactUntilMaxPlayers={shouldUseCompactInfo}
            />

            {onToggleSessionStatus &&
              session.status !== 'FINISHED' &&
              session.status !== 'CANCELLED' && (
                <Flex mt={3} justify="center" gap={3} wrap="wrap">
                  <Button
                    data-tour={
                      session.status === 'PREPARING'
                        ? 'start-session'
                        : undefined
                    }
                    colorPalette={
                      session.status === 'PREPARING'
                        ? 'green'
                        : isOvertime
                          ? 'orange'
                          : 'red'
                    }
                    size="lg"
                    px={8}
                    disabled={(() => {
                      if (session.status === 'PREPARING') {
                        if (session.endTime)
                          return new Date(session.endTime) < new Date();
                        if (session.startTime) {
                          const computed = new Date(session.startTime);
                          computed.setMinutes(
                            computed.getMinutes() +
                              (session.sessionDuration || 120)
                          );
                          return computed < new Date();
                        }
                      }
                      return false;
                    })()}
                    onClick={onToggleSessionStatus}
                    loading={isToggleStatusLoading}
                    leftIcon={
                      session.status === 'PREPARING' ? (
                        <Play size={20} />
                      ) : (
                        <Square size={20} />
                      )
                    }
                  >
                    {session.status === 'PREPARING'
                      ? t('start')
                      : isOvertime
                        ? t('endAndFinalize')
                        : t('endSession')}
                  </Button>

                  {/* Cancel button for PREPARING */}
                  {session.status === 'PREPARING' && onCancelSession && (
                    <Button
                      colorPalette="red"
                      variant="outline"
                      size="lg"
                      px={6}
                      onClick={onCancelSession}
                      leftIcon={<XCircle size={20} />}
                    >
                      {t('cancelSession')}
                    </Button>
                  )}
                </Flex>
              )}
          </Box>
        </Box>

        {/* Right Column: Join Session Card */}
        <Box as="section" h="full">
          <Box
            p={6}
            bg={{ base: 'white', _dark: 'gray.800' }}
            _dark={{ borderColor: 'gray.700' }}
            borderRadius="xl"
            shadow="sm"
            border="1px solid"
            borderColor="gray.100"
            display="flex"
            flexDirection="column"
            alignItems="center"
            h="full"
          >
            <Box w="full">
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="gray.500"
                mb={4}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {t('shareSessionSection')}
              </Text>

              <Box
                flex={1}
                display="flex"
                flexDirection="column"
                justifyContent="center"
                w="full"
              >
                <Flex
                  justify="center"
                  gap={{ base: 2, md: 6 }}
                  alignItems="center"
                >
                  <Box>
                    <QRCodeGenerator
                      joinCode={joinCode}
                      size={140}
                      url={`/${locale}/sessions/${session.id}`}
                      label={t('qrViewSessionDetail')}
                      hideCode
                      onQrClick={() =>
                        handleQrClick(
                          `/${locale}/sessions/${session.id}`,
                          t('qrViewSessionDetail')
                        )
                      }
                    />
                  </Box>
                  <Box display="none">
                    <QRCodeGenerator
                      joinCode={joinCode}
                      size={140}
                      url={`/${locale}/sessions/${session.id}/join`}
                      label={t('qrScanToJoin')}
                      hideCode
                      onQrClick={() =>
                        handleQrClick(
                          `/${locale}/sessions/${session.id}/join`,
                          t('qrScanToJoin')
                        )
                      }
                    />
                  </Box>
                </Flex>

                <SimpleGrid
                  columns={1}
                  spacing={4}
                  mt={6}
                  display={{ base: 'none', md: 'grid' }}
                >
                  <Box
                    p={4}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.100"
                    bg={{ base: 'gray.50', _dark: 'gray.700' }}
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color="gray.500"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      mb={3}
                    >
                      {t('shareTipsTitle')}
                    </Text>
                    <Flex align="start" gap={3} mb={3}>
                      <Box
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        bg="blue.400"
                        mt="6px"
                        flexShrink={0}
                      />
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" color="fg">
                          {t('qrViewSessionDetail')}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {t('shareTipView')}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                </SimpleGrid>
              </Box>

              {/* Share Image Section */}
              <Box w="full" mt={6}>
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="gray.500"
                  mb={4}
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {t('shareImage')}
                </Text>
                <Flex gap={3} w="full">
                  <Button
                    flex={1}
                    colorPalette="green"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsShareImageModalOpen(true)}
                    leftIcon={<Icon as={Download} />}
                  >
                    {tSession('shareImageModal.open')}
                  </Button>
                </Flex>
              </Box>

              {/* Share Image Tips - Desktop Only */}
              <Box
                mt={4}
                p={4}
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.100"
                bg={{ base: 'blue.50', _dark: 'blue.900/20' }}
                display={{ base: 'none', md: 'block' }}
              >
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="blue.600"
                  _dark={{ color: 'blue.300' }}
                  textTransform="uppercase"
                  letterSpacing="wider"
                  mb={2}
                >
                  {t('shareImageTipsTitle')}
                </Text>
                <Text
                  fontSize="sm"
                  color="blue.700"
                  _dark={{ color: 'blue.200' }}
                >
                  {t('shareImageTipsDescription')}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Grid>

      {/* Fill Rate Banner - visible when IN_PROGRESS */}
      {/* {session.status === SessionStatus.IN_PROGRESS && (
        <Box
          mb={4}
          p={4}
          bg="green.50"
          _dark={{ bg: 'green.900/20', borderColor: 'green.800' }}
          borderRadius="xl"
          border="1px solid"
          borderColor="green.100"
        >
          <Flex align="center" justify="space-between" mb={2}>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="green.700"
              _dark={{ color: 'green.300' }}
            >
              {t('fillRate')}
            </Text>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="green.700"
              _dark={{ color: 'green.300' }}
            >
              {totalPlayers} / {maxPlayers} ({fillPercent}%)
            </Text>
          </Flex>
          <Box
            h="8px"
            bg="green.100"
            _dark={{ bg: 'green.800' }}
            borderRadius="full"
            overflow="hidden"
          >
            <Box
              h="full"
              bg={fillPercent >= 80 ? 'orange.400' : 'green.500'}
              borderRadius="full"
              style={{ width: `${Math.min(fillPercent, 100)}%` }}
            />
          </Box>
        </Box>
      )} */}

      {/* Session Statistics */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Box
          p={4}
          bg={{ base: 'white', _dark: 'gray.800' }}
          borderRadius="xl"
          shadow="sm"
          border="1px solid"
          borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
        >
          <Flex align="center" mb={2}>
            <Box
              p={2}
              bg={{ base: 'brand.50', _dark: 'brand.900/30' }}
              color="green.500"
              borderRadius="lg"
              mr={3}
            >
              <Users size={20} />
            </Box>
            <Text fontSize="sm" color="fg.muted" fontWeight="medium">
              {t('playersTab.players')}
            </Text>
          </Flex>
          <Flex align="baseline" gap={1.5}>
            <Text fontSize="2xl" fontWeight="bold" color="fg">
              {totalPlayers}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              / {maxPlayers}
            </Text>
          </Flex>
          {(maleCount > 0 || femaleCount > 0) && (
            <Text fontSize="xs" color="gray.500">
              👨 {maleCount} {tSession('male')} • 👩 {femaleCount}{' '}
              {tSession('female')}
            </Text>
          )}
          <Box
            mt={2}
            h="4px"
            bg="gray.100"
            _dark={{ bg: 'gray.600' }}
            borderRadius="full"
            overflow="hidden"
          >
            <Box
              h="full"
              bg={fillPercent >= 80 ? 'orange.400' : 'green.400'}
              borderRadius="full"
              style={{ width: `${Math.min(fillPercent, 100)}%` }}
            />
          </Box>
        </Box>

        <Box
          p={4}
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
        >
          <Flex align="center" mb={2}>
            <Box
              p={2}
              bg={{ base: 'orange.50', _dark: 'orange.900/30' }}
              color="orange.500"
              borderRadius="lg"
              mr={3}
            >
              <Clock size={20} />
            </Box>
            <Text
              fontSize="sm"
              color="fg.muted"
              fontWeight="medium"
              textTransform="capitalize"
            >
              {t('waiting')}
            </Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="fg">
            {waitingPlayers}
          </Text>
        </Box>

        <Box
          p={4}
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
        >
          <Flex align="center" mb={2}>
            <Box
              p={2}
              bg={{ base: 'green.50', _dark: 'green.900/30' }}
              color="green.500"
              borderRadius="lg"
              mr={3}
            >
              <Activity size={20} />
            </Box>
            <Text
              fontSize="sm"
              color="fg.muted"
              fontWeight="medium"
              textTransform="capitalize"
            >
              {t('playing')}
            </Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="fg">
            {playingPlayers}
          </Text>
        </Box>

        <Box
          p={4}
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
        >
          <Flex align="center" mb={2}>
            <Box
              p={2}
              bg={{ base: 'teal.50', _dark: 'teal.900/30' }}
              color="teal.500"
              borderRadius="lg"
              mr={3}
            >
              <CheckCircle size={20} />
            </Box>
            <Text
              fontSize="sm"
              color="fg.muted"
              fontWeight="medium"
              textTransform="capitalize"
            >
              {t('playersTab.ready')}
            </Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="fg">
            {readyPlayers}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Rate Players Section - Show when session is FINISHED */}
      {session.status === SessionStatus.FINISHED && session.players && (
        <Box mt={8}>
          <RatePlayersSection
            sessionId={session.id}
            players={session.players}
          />
        </Box>
      )}

      <Box mt={8}>
        <Flex align="center" justify="space-between" gap={3} mb={4} wrap="wrap">
          <Flex align="center" gap={2}>
            <Heading size="md">{t('playersTab.playerStatistics')}</Heading>
            <IconButton
              aria-label={t('playersTab.rankingInfoAriaLabel')}
              size="xs"
              variant="ghost"
              colorPalette="green"
              minW="28px"
              h="28px"
              borderRadius="full"
              icon={<Info size={15} />}
              onClick={() => setIsRankingInfoOpen(true)}
            />
          </Flex>
          {session.status === SessionStatus.FINISHED && (
            <Button
              colorPalette="green"
              variant="solid"
              size="sm"
              leftIcon={<Share2 size={16} />}
              onClick={() => setIsShareResultsConfirmOpen(true)}
            >
              {t('shareResultsButton')}
            </Button>
          )}
        </Flex>
        <SessionPlayers sessionId={session.id} session={session} />
      </Box>

      <VModal
        isOpen={isRankingInfoOpen}
        onClose={() => setIsRankingInfoOpen(false)}
        title={t('playersTab.rankingInfoTitle')}
        size="md"
        hideSecondaryAction
        primaryActionText={t('playersTab.rankingInfoClose')}
        onPrimaryAction={() => setIsRankingInfoOpen(false)}
      >
        <VStack align="stretch" gap={4}>
          <Box>
            <Text fontWeight="semibold" mb={2}>
              {t('playersTab.rankingInfoEligibilityTitle')}
            </Text>
            <Text color="fg.muted" fontSize="sm">
              {t('playersTab.rankingInfoEligibility')}
            </Text>
            <Text color="orange.600" fontSize="xs" mt={1.5} fontStyle="italic">
              {t('playersTab.rankingInfoEligibilityExample')}
            </Text>
          </Box>
          <Box>
            <Text fontWeight="semibold" mb={2}>
              {t('playersTab.rankingInfoOrderTitle')}
            </Text>
            <VStack align="stretch" gap={1.5} color="fg.muted" fontSize="sm">
              <Text>{t('playersTab.rankingInfoOrderWinRate')}</Text>
              <Text>{t('playersTab.rankingInfoOrderWins')}</Text>
              <Text>{t('playersTab.rankingInfoOrderPointDifferential')}</Text>
              <Text>{t('playersTab.rankingInfoOrderMatches')}</Text>
              <Text>{t('playersTab.rankingInfoOrderTie')}</Text>
            </VStack>
            <Text color="fg.muted" fontSize="xs" mt={2}>
              {t('playersTab.rankingInfoPointDifferentialDescription')}
            </Text>
          </Box>
          <Box>
            <Text fontWeight="semibold" mb={2}>
              {t('playersTab.rankingInfoMvpTitle')}
            </Text>
            <Text color="fg.muted" fontSize="sm">
              {t('playersTab.rankingInfoMvp')}
            </Text>
          </Box>
        </VStack>
      </VModal>

      <SessionShareImageModal
        isOpen={isShareImageModalOpen}
        onClose={() => setIsShareImageModalOpen(false)}
        session={session}
      />

      <VModal
        isOpen={isShareResultsConfirmOpen}
        onClose={() => setIsShareResultsConfirmOpen(false)}
        title={t('shareResultsConfirmTitle')}
        size="sm"
        primaryActionText={t('shareResultsButton')}
        secondaryActionText={t('cancel')}
        onPrimaryAction={handleShareResults}
        isPrimaryLoading={isSharingResults}
        isSecondaryDisabled={isSharingResults}
      >
        <Text fontSize="sm" color="fg.muted">
          {t('shareResultsConfirmMessage')}
        </Text>
      </VModal>

      {/* Edit Session Drawer */}
      <VDrawer
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('editSession')}
        size="lg"
        mobileWidth="calc(100% - 16px)"
        placement="right"
        hideSecondaryAction
        showCloseButton
      >
        <SessionEditForm
          sessionId={session.id}
          onSuccess={() => {
            setIsEditModalOpen(false);
            refreshSessionData?.();
          }}
          useDrawerMobileFooter
          mobileFooterWidth="calc(100% - 16px)"
        />
      </VDrawer>

      {/* QR Code Expansion Modal */}
      <VModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={selectedQrLabel}
        size="md"
      >
        <Flex justify="center" align="center" p={4} pb={8}>
          <QRCodeGenerator
            joinCode={joinCode}
            size={300}
            url={selectedQrUrl}
            hideCode
            label={selectedQrLabel}
          />
        </Flex>
      </VModal>
    </Box>
  );
}
