'use client';

import { useState } from 'react';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { Button, SimpleGrid, VStack } from '@/components/ui/chakra-compat';
import { VDrawer } from '@/components/ui/VDrawer';
import { VModal } from '@/components/ui/VModal';
import { ISession, Player, SessionStatus } from '@/lib/api/types';
import AppImageGallery from '@/components/session/AppImageGallery';
import {
  Badge,
  Box,
  Flex,
  FlexProps,
  Grid,
  Heading,
  Text,
  Icon,
} from '@chakra-ui/react';
import {
  Activity,
  CheckCircle,
  Clock,
  DoorOpen,
  Pencil,
  Play,
  Shield,
  Square,
  UserPlus,
  Users,
  XCircle,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { useDownloadSessionImage } from '@/hooks/useDownloadSessionImage';
import { useLocale, useTranslations } from 'next-intl';
import SessionInfo from './SessionInfo';
import SessionEditForm from './SessionEditForm';
import SessionPlayers from './SessionPlayers';
import BaseSessionCard from './BaseSessionCard';
import SessionShareCard from './SessionShareCard';
import { RatePlayersSection } from '@/components/rating';

interface InfoRowProps extends FlexProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}

const InfoRow = ({ icon, label, children, ...props }: InfoRowProps) => (
  <Flex align="start" mb={3} {...props}>
    <Box
      as={icon}
      boxSize={5}
      mr={3}
      mt={0.5}
      color="gray.400"
      flexShrink={0}
    />
    <Text
      fontSize="md"
      color="gray.600"
      _dark={{ color: 'gray.400' }}
      mr={2}
      minW="fit-content"
      fontWeight="normal"
    >
      {label}:
    </Text>
    <Box
      flex={1}
      color="gray.800"
      _dark={{ color: 'gray.100' }}
      fontWeight="medium"
    >
      {children}
    </Box>
  </Flex>
);

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
  const locale = useLocale();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedQrUrl, setSelectedQrUrl] = useState('');
  const [selectedQrLabel, setSelectedQrLabel] = useState('');

  const { downloadSessionImage, isDownloading } = useDownloadSessionImage();

  const handleQrClick = (url: string, label: string) => {
    setSelectedQrUrl(url);
    setSelectedQrLabel(label);
    setIsQrModalOpen(true);
  };

  const joinCode = session.id.slice(-8).toUpperCase();

  const totalPlayers = session.players?.length || 0;
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

            <SessionInfo session={session} />

            {onToggleSessionStatus &&
              session.status !== 'FINISHED' &&
              session.status !== 'CANCELLED' && (
                <Flex mt={6} justify="center" gap={3} wrap="wrap">
                  <Button
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
            <Box w="full" mb={6}>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="gray.500"
                mb={4}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {t('settings')}
              </Text>
              <VStack align="start" spacing={3}>
                <InfoRow icon={Shield} label={t('requirePlayerInfo')}>
                  <Badge
                    colorPalette={session.requirePlayerInfo ? 'green' : 'gray'}
                  >
                    {session.requirePlayerInfo ? t('yes') : t('no')}
                  </Badge>
                </InfoRow>

                <InfoRow icon={UserPlus} label={t('allowGuestJoin')}>
                  <Badge
                    colorPalette={session.allowGuestJoin ? 'green' : 'gray'}
                  >
                    {session.allowGuestJoin ? t('yes') : t('no')}
                  </Badge>
                </InfoRow>

                <InfoRow icon={DoorOpen} label={t('allowNewPlayers')}>
                  <Badge
                    colorPalette={session.allowNewPlayers ? 'green' : 'gray'}
                  >
                    {session.allowNewPlayers ? t('yes') : t('no')}
                  </Badge>
                </InfoRow>
              </VStack>
            </Box>

            <Box
              w="full"
              h="1px"
              bg="gray.100"
              _dark={{ bg: 'gray.700' }}
              mb={6}
            />

            <Box
              flex={1}
              display="flex"
              flexDirection="column"
              justifyContent="center"
              w="full"
            >
              <Grid
                templateColumns="repeat(2, 1fr)"
                gap={{ base: 2, md: 6 }}
                justifyItems="center"
                alignItems="center"
              >
                <Box>
                  <QRCodeGenerator
                    joinCode={joinCode}
                    size={140}
                    url={`/${locale}/sessions/${session.id}`}
                    label={t('qrScanToView')}
                    hideCode
                    onQrClick={() =>
                      handleQrClick(
                        `/${locale}/sessions/${session.id}`,
                        t('qrScanToView')
                      )
                    }
                  />
                </Box>
                <Box>
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
              </Grid>
            </Box>

            <Box
              w="full"
              h="1px"
              bg="gray.100"
              _dark={{ bg: 'gray.700' }}
              mt={6}
              mb={6}
            />

            {/* Share Section */}
            <Box w="full">
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="gray.500"
                mb={4}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {t('share')}
              </Text>
              <Flex gap={3} w="full">
                <Button
                  flex={1}
                  colorPalette="green"
                  variant="outline"
                  size="sm"
                  loading={isDownloading}
                  onClick={() =>
                    downloadSessionImage(
                      session,
                      `session-share-card-social-${session.id}`,
                      'TuyenVangLai'
                    )
                  }
                  leftIcon={<Icon as={Download} />}
                >
                  Tỷ lệ 4:5
                </Button>
                <Button
                  flex={1}
                  colorPalette="green"
                  variant="outline"
                  size="sm"
                  loading={isDownloading}
                  onClick={() =>
                    downloadSessionImage(
                      session,
                      `session-share-card-portrait-${session.id}`,
                      'TuyenVangLai'
                    )
                  }
                  leftIcon={<Icon as={Download} />}
                >
                  Tỷ lệ 2:3
                </Button>
              </Flex>
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
        <Heading size="md" mb={4}>
          {t('playersTab.playerStatistics')}
        </Heading>
        <SessionPlayers sessionId={session.id} session={session} />
      </Box>

      {/* Hidden containers for session card preview export */}
      <Box
        position="absolute"
        left="-9999px"
        top="-9999px"
        zIndex={-1}
        pointerEvents="none"
      >
        <Box id={`session-card-preview-${session.id}-portrait`}>
          <SessionShareCard session={session} mode="portrait" />
        </Box>
        <Box mt={4} id={`session-card-preview-${session.id}-social`}>
          <SessionShareCard session={session} mode="social" />
        </Box>
      </Box>

      {/* Edit Session Drawer */}
      <VDrawer
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('editSession')}
        size="lg"
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
