'use client';

import {
  Box,
  Flex,
  Text,
  Badge,
  FlexProps,
  SimpleGrid,
  Spinner,
} from '@chakra-ui/react';
import { Button, IconButton, VStack } from '@/components/ui/chakra-compat';
import {
  Award,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Feather,
  Info,
  MapPin,
  Map,
  Square,
  Users,
  User,
  Tag,
  FileText,
  DollarSign,
  Download,
} from 'lucide-react';
import { ISession, Player, PlayerStatistics } from '@/lib/api/types';
import { useLocale, useTranslations } from 'next-intl';
import { formatTime } from '@/utils/session-helpers';
import dayjs from '@/lib/dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import { Locale } from '@/i18n/locales';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { useState, useEffect } from 'react';
import { SessionService } from '@/lib/api/session.service';
import FeeDetailPopover from '@/components/fee/FeeDetailPopover';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { FeeService } from '@/lib/api/fee.service';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import LevelBadgeWithDescription from './LevelBadgeWithDescription';
import LevelDescriptionsModal from './LevelDescriptionsModal';
import { useDownloadSessionImage } from '@/hooks/useDownloadSessionImage';

interface InfoRowProps extends FlexProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  isTruncated?: boolean;
  hideLabelOnMobile?: boolean;
}

const InfoRow = ({
  icon,
  label,
  children,
  isTruncated,
  hideLabelOnMobile,
  ...props
}: InfoRowProps) => (
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
      display={hideLabelOnMobile ? { base: 'none', md: 'block' } : undefined}
    >
      {label}:
    </Text>
    <Box
      flex={1}
      color="gray.800"
      _dark={{ color: 'gray.100' }}
      fontWeight="medium"
      minW={0}
      lineClamp={isTruncated ? 1 : undefined}
    >
      {children}
    </Box>
  </Flex>
);

interface SessionInfoProps {
  session: ISession;
  player?: Player | null;
  compactUntilMaxPlayers?: boolean;
}

const PlayerAchievementExportCard = ({
  session,
  player,
  playerStats,
}: {
  session: ISession;
  player: Player;
  playerStats: PlayerStatistics;
}) => {
  const t = useTranslations('SessionDetail');
  const locale = useLocale();
  const playerName = playerStats.name || player.name || t('stats.unnamed');
  const sessionDate = session.startTime
    ? dayjs(session.startTime)
        .locale(locale === Locale.VI ? Locale.VI : Locale.EN)
        .format('DD/MM/YYYY')
    : null;
  const sessionTime = session.startTime
    ? `${formatTime(session.startTime)} - ${
        session.endTime ? formatTime(session.endTime) : '--:--'
      }`
    : null;
  const venueName = session.venue?.name || session.location;
  const isNA = playerStats.wins === 0 && playerStats.losses === 0;

  return (
    <Box w="520px" bg="white" color="gray.900" p={8}>
      <VStack align="stretch" gap={5}>
        <Box borderRadius="2xl" bg="green.600" color="white" px={6} py={5}>
          <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">
            {t('stats.achievementImageTitle')}
          </Text>
          <Text mt={1} fontSize="3xl" fontWeight="black" lineHeight="1.1">
            {playerName}
          </Text>
          <Text mt={2} fontSize="md" fontWeight="semibold" opacity={0.92}>
            {session.name}
          </Text>
        </Box>

        <SimpleGrid columns={2} gap={3}>
          <Box bg="gray.50" borderRadius="xl" p={4} textAlign="center">
            <Text fontSize="xs" color="gray.500" fontWeight="bold">
              {t('stats.totalMatches')}
            </Text>
            <Text mt={1} fontSize="3xl" fontWeight="black" color="gray.900">
              {playerStats.totalMatches}
            </Text>
          </Box>
          <Box bg="yellow.50" borderRadius="xl" p={4} textAlign="center">
            <Text fontSize="xs" color="yellow.700" fontWeight="bold">
              {t('stats.winRate')}
            </Text>
            <Text mt={1} fontSize="3xl" fontWeight="black" color="yellow.700">
              {isNA ? '-' : `${playerStats.winRate}%`}
            </Text>
          </Box>
          <Box bg="green.50" borderRadius="xl" p={4} textAlign="center">
            <Text fontSize="xs" color="green.700" fontWeight="bold">
              {t('stats.wins')}
            </Text>
            <Text mt={1} fontSize="2xl" fontWeight="black" color="green.700">
              {isNA ? '-' : playerStats.wins}
            </Text>
          </Box>
          <Box bg="red.50" borderRadius="xl" p={4} textAlign="center">
            <Text fontSize="xs" color="red.600" fontWeight="bold">
              {t('stats.losses')}
            </Text>
            <Text mt={1} fontSize="2xl" fontWeight="black" color="red.600">
              {isNA ? '-' : playerStats.losses}
            </Text>
          </Box>
        </SimpleGrid>

        {playerStats.totalShuttlecocks != null && (
          <Flex
            align="center"
            justify="space-between"
            bg="teal.50"
            borderRadius="xl"
            px={4}
            py={3}
          >
            <Text fontSize="sm" color="teal.700" fontWeight="bold">
              {t('stats.totalShuttlecocks')}
            </Text>
            <Text fontSize="xl" color="teal.700" fontWeight="black">
              {playerStats.totalShuttlecocks}
            </Text>
          </Flex>
        )}

        <VStack
          align="stretch"
          gap={1.5}
          borderTopWidth="1px"
          borderColor="gray.100"
          pt={4}
        >
          {venueName && (
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              {venueName}
            </Text>
          )}
          {(sessionDate || sessionTime) && (
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              {[sessionDate, sessionTime].filter(Boolean).join(' - ')}
            </Text>
          )}
        </VStack>

        <Flex justify="space-between" align="center">
          <Text fontSize="xs" color="gray.500" fontWeight="bold">
            Vmito App
          </Text>
          <Text fontSize="xs" color="green.700" fontWeight="bold">
            {t('stats.appTagline')}
          </Text>
        </Flex>
      </VStack>
    </Box>
  );
};

export default function SessionInfo({
  session,
  player,
  compactUntilMaxPlayers = false,
}: SessionInfoProps) {
  const t = useTranslations('SessionDetail');
  const tSession = useTranslations('session');
  const tLevelDescriptions = useTranslations('common.levelDescriptions');
  const locale = useLocale();
  const { getLevelShortLabel } = useLevelLabel();
  const [playerStats, setPlayerStats] = useState<PlayerStatistics | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLevelDescriptionsOpen, setIsLevelDescriptionsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compactUntilMaxPlayers);
  const { downloadSessionImage, isDownloading } = useDownloadSessionImage();

  const showExtendedInfo = !compactUntilMaxPlayers || isExpanded;

  const playerAchievementExportId =
    player && playerStats
      ? `player-achievement-export-${session.id}-${player.id}`
      : '';

  useEffect(() => {
    const fetchStats = async () => {
      const targetSessionId = session.id;
      if (!targetSessionId || !player?.id) {
        setPlayerStats(null);
        return;
      }

      try {
        setIsLoadingStats(true);
        const response =
          await SessionService.getPlayerStatistics(targetSessionId);
        const myStats = response.playerStats.find(
          (s) => s.playerId === player.id
        );
        if (myStats) {
          setPlayerStats(myStats);
        } else {
          setPlayerStats(null);
        }
      } catch (error) {
        console.error('Failed to fetch player stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [session.id, player?.id]);

  const handleDownloadAchievement = () => {
    if (!playerStats || !player || !playerAchievementExportId) return;

    downloadSessionImage(session, playerAchievementExportId, 'ThanhTichCaNhan');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PREPARING':
        return 'brand';
      case 'IN_PROGRESS':
        return 'green';
      case 'FINISHED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  return (
    <VStack spacing={2} align="stretch">
      <InfoRow icon={Tag} label={t('sessionName')}>
        <Text fontWeight="bold">{session.name}</Text>
      </InfoRow>

      <InfoRow icon={User} label={t('host')}>
        {session.host?.name || 'Unknown'}
      </InfoRow>

      <InfoRow icon={Info} label={t('status')}>
        <Badge
          colorPalette={getStatusColor(session.status)}
          variant="subtle"
          px={2}
          borderRadius="md"
        >
          {session.status === 'PREPARING'
            ? t('notStarted')
            : session.status === 'IN_PROGRESS'
              ? t('inProgress')
              : t('finished')}
        </Badge>
      </InfoRow>

      <InfoRow icon={Map} label={t('venue')}>
        {session.venue?.name || t('common.notAvailable')}
      </InfoRow>

      <InfoRow icon={MapPin} label={t('location')} hideLabelOnMobile>
        <AppAddressDisplay
          address={
            session.venue?.address || session.location || t('noLocation')
          }
          district={session.venue?.district}
          newAddress={session.venue?.newAddress}
          newDistrict={session.venue?.newDistrict}
          fontSize="md"
          color="inherit"
          newAddressColor="blue.500"
        />
      </InfoRow>

      <InfoRow icon={Calendar} label={t('date')}>
        <Text textTransform="capitalize">
          {session.startTime
            ? dayjs(session.startTime)
                .locale(locale === Locale.VI ? Locale.VI : Locale.EN)
                .format('dddd, DD/MM/YY')
            : t('notScheduled')}
        </Text>
      </InfoRow>

      <InfoRow icon={Clock} label={t('sessionTime')}>
        {session.startTime ? formatTime(session.startTime) : '--:--'} -{' '}
        {session.endTime ? formatTime(session.endTime) : '--:--'}
      </InfoRow>

      <InfoRow icon={Users} label={t('maxPlayersTitle') || 'Tối đa'}>
        {session.numberOfCourts * (session.maxPlayersPerCourt || 4)} (
        {t('playersTab.players') || 'Người chơi'})
      </InfoRow>

      {compactUntilMaxPlayers && (
        <Button
          type="button"
          size="xs"
          variant="ghost"
          colorPalette="green"
          alignSelf="flex-start"
          mt={-1}
          mb={showExtendedInfo ? 2 : 0}
          px={0}
          minH="auto"
          fontWeight="semibold"
          rightIcon={
            showExtendedInfo ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )
          }
          onClick={() => setIsExpanded((current) => !current)}
        >
          {showExtendedInfo ? tSession('collapse') : tSession('expand')}
        </Button>
      )}

      {showExtendedInfo && (
        <>
          <InfoRow icon={Square} label={t('numberOfCourtsTitle')}>
            {session.numberOfCourts}
          </InfoRow>

          {session.shuttlecock && (
            <InfoRow icon={Feather} label={t('shuttlecock')}>
              {session.shuttlecock}
            </InfoRow>
          )}

          <InfoRow icon={Award} label={t('requiredLevels')}>
            <Flex gap={2} flexWrap="wrap" align="center">
              {session.requiredLevels && session.requiredLevels.length > 0 ? (
                Array.from(new Set(session.requiredLevels))
                  .sort((a, b) => a - b)
                  .map((level: number) => {
                    const levelColor = getSkillLevelColor([level]);
                    return (
                      <LevelBadgeWithDescription
                        key={level}
                        level={level}
                        colorPalette={levelColor.colorPalette}
                        variant="solid"
                        fontSize="xs"
                        fontWeight="bold"
                        px={2.5}
                        py={0.5}
                        borderRadius="full"
                        borderWidth="1px"
                        borderColor={levelColor.borderColor}
                      >
                        {getLevelShortLabel(level)}
                      </LevelBadgeWithDescription>
                    );
                  })
              ) : (
                <Badge
                  colorPalette="gray"
                  variant="subtle"
                  fontSize="xs"
                  fontWeight="bold"
                  px={2.5}
                  py={0.5}
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="gray.200"
                >
                  {t('allLevels')}
                </Badge>
              )}
              <IconButton
                aria-label={tLevelDescriptions('open')}
                type="button"
                size="xs"
                variant="ghost"
                colorPalette="green"
                color="green.500"
                bg="green.50"
                _hover={{
                  color: 'green.600',
                  bg: 'green.100',
                  transform: 'scale(1.1)',
                }}
                _active={{ transform: 'scale(0.95)' }}
                flexShrink={0}
                minW="20px"
                h="20px"
                borderRadius="full"
                transition="all 0.2s"
                icon={<Info size={12} />}
                onClick={(event) => {
                  event.stopPropagation();
                  setIsLevelDescriptionsOpen(true);
                }}
              />
            </Flex>
          </InfoRow>

          {session.feeConfig && (
            <InfoRow icon={DollarSign} label={t('fee')}>
              <Flex align="center">
                <Text color="green.600" fontWeight="bold">
                  {FeeService.getFeeDisplayText(session.feeConfig)}
                </Text>
                {session.feeConfig.feeType === 'FIXED' && (
                  <Text ml={1} color="gray.500" fontSize="sm">
                    /slot
                  </Text>
                )}
                <FeeDetailPopover feeConfig={session.feeConfig} />
              </Flex>
            </InfoRow>
          )}

          {session.description && (
            <InfoRow icon={FileText} label={t('description')}>
              <Text lineHeight="tall">{session.description}</Text>
            </InfoRow>
          )}

          <LevelDescriptionsModal
            isOpen={isLevelDescriptionsOpen}
            onClose={() => setIsLevelDescriptionsOpen(false)}
          />
        </>
      )}

      {/* Player Statistics Section */}
      {player && player.status !== 'INACTIVE' && (
        <Box
          mt={4}
          pt={4}
          borderTopWidth="1px"
          borderColor="gray.100"
          _dark={{ borderColor: 'gray.700' }}
        >
          <Flex align="center" justify="space-between" mb={3} gap={3}>
            <Flex align="center" minW={0}>
              <Box as={Award} boxSize={5} color="yellow.500" mr={2} />
              <Text
                fontWeight="bold"
                fontSize="md"
                color="gray.700"
                _dark={{ color: 'gray.200' }}
              >
                {t('playerStatsTitle')}
              </Text>
            </Flex>

            {playerStats && (
              <IconButton
                aria-label={t('stats.downloadAchievement')}
                type="button"
                size="xs"
                variant="outline"
                colorPalette="green"
                isLoading={isDownloading}
                icon={<Download size={14} />}
                onClick={handleDownloadAchievement}
              />
            )}
          </Flex>

          {isLoadingStats ? (
            <Flex justify="center" py={4}>
              <Spinner size="sm" color="green.500" />
            </Flex>
          ) : playerStats ? (
            <SimpleGrid columns={2} gap={3}>
              <Box
                p={2}
                bg="gray.50"
                _dark={{ bg: 'gray.700' }}
                borderRadius="md"
                textAlign="center"
              >
                <Text fontSize="xs" color="gray.500" mb={1}>
                  {t('stats.wins')}
                </Text>
                <Text fontWeight="bold" color="green.500">
                  {playerStats.wins}
                </Text>
              </Box>
              <Box
                p={2}
                bg="gray.50"
                _dark={{ bg: 'gray.700' }}
                borderRadius="md"
                textAlign="center"
              >
                <Text fontSize="xs" color="gray.500" mb={1}>
                  {t('stats.losses')}
                </Text>
                <Text fontWeight="bold" color="red.500">
                  {playerStats.losses}
                </Text>
              </Box>
              <Box
                p={2}
                bg="gray.50"
                _dark={{ bg: 'gray.700' }}
                borderRadius="md"
                textAlign="center"
              >
                <Text fontSize="xs" color="gray.500" mb={1}>
                  {t('stats.winRate')}
                </Text>
                <Text
                  fontWeight="bold"
                  color={playerStats.winRate >= 50 ? 'green.500' : 'orange.500'}
                >
                  {playerStats.winRate}%
                </Text>
              </Box>
              <Box
                p={2}
                bg="gray.50"
                _dark={{ bg: 'gray.700' }}
                borderRadius="md"
                textAlign="center"
              >
                <Text fontSize="xs" color="gray.500" mb={1}>
                  {t('stats.totalMatches')}
                </Text>
                <Text fontWeight="bold">{playerStats.totalMatches}</Text>
              </Box>
            </SimpleGrid>
          ) : (
            <Text fontSize="sm" color="gray.500" textAlign="center">
              {t('stats.noData')}
            </Text>
          )}

          {playerStats && playerAchievementExportId && (
            <Box position="absolute" left="-9999px" top="-9999px">
              <Box id={playerAchievementExportId}>
                <PlayerAchievementExportCard
                  session={session}
                  player={player}
                  playerStats={playerStats}
                />
              </Box>
            </Box>
          )}
        </Box>
      )}
    </VStack>
  );
}
