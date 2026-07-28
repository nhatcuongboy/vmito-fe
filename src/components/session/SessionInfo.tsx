'use client';

import {
  Box,
  Flex,
  Text,
  Badge,
  FlexProps,
  SimpleGrid,
  Spinner,
  Image,
} from '@chakra-ui/react';
import QRCode from 'qrcode';
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
  ListChecks,
  Percent,
  Trophy,
  XCircle,
} from 'lucide-react';
import { ISession, Player, PlayerStatistics } from '@/lib/api/types';
import { useLocale, useTranslations } from 'next-intl';
import { formatTimeRangeByDevicePreference } from '@/utils/time-helpers';
import dayjs from '@/lib/dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import { Locale } from '@/i18n/locales';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { useState, useEffect, useMemo } from 'react';
import { SessionService } from '@/lib/api/session.service';
import FeeDetailPopover from '@/components/fee/FeeDetailPopover';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { sortLevelsByRank } from '@/constants/levels';
import { FeeService } from '@/lib/api/fee.service';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import {
  getSessionLocationAddress,
  getSessionLocationName,
} from '@/utils/session-location';
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

type PlayerDoublesMatchStats = {
  menDoubles: number;
  womenDoubles: number;
  mixedDoubles: number;
};

const EMPTY_DOUBLES_MATCH_STATS: PlayerDoublesMatchStats = {
  menDoubles: 0,
  womenDoubles: 0,
  mixedDoubles: 0,
};

const getPlayerDoublesMatchStats = (
  matches: Awaited<ReturnType<typeof SessionService.getSessionMatches>>
): PlayerDoublesMatchStats => {
  return matches.reduce<PlayerDoublesMatchStats>(
    (totals, match) => {
      if (
        match.status !== 'FINISHED' &&
        (match.status as string) !== 'COMPLETED'
      ) {
        return totals;
      }

      const genders =
        match.players
          ?.map((matchPlayer) => matchPlayer.player?.gender)
          .filter(
            (gender): gender is 'MALE' | 'FEMALE' =>
              gender === 'MALE' || gender === 'FEMALE'
          ) ?? [];

      if (genders.length !== 4) return totals;

      const menCount = genders.filter((gender) => gender === 'MALE').length;
      const womenCount = genders.filter((gender) => gender === 'FEMALE').length;

      if (menCount === 4) {
        totals.menDoubles += 1;
      } else if (womenCount === 4) {
        totals.womenDoubles += 1;
      } else if (menCount === 2 && womenCount === 2) {
        totals.mixedDoubles += 1;
      }

      return totals;
    },
    { ...EMPTY_DOUBLES_MATCH_STATS }
  );
};

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
  const initials = playerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const sessionDate = session.startTime
    ? new Intl.DateTimeFormat(locale === Locale.VI ? 'vi-VN' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(session.startTime))
    : null;
  const sessionTime = session.startTime
    ? formatTimeRangeByDevicePreference(session.startTime, session.endTime)
    : null;
  const venueName = getSessionLocationName(session);
  const hasResultStats = playerStats.wins + playerStats.losses > 0;

  const [qrDataUrl, setQrDataUrl] = useState('');
  useEffect(() => {
    const url = `${window.location.origin}/${locale}/sessions/${session.id}`;
    QRCode.toDataURL(url, {
      margin: 0,
      width: 240,
      color: { dark: '#0e5c23', light: '#FFFFFF' },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('Error generating QR code:', err));
  }, [locale, session.id]);
  const achievementStats = [
    {
      label: t('stats.totalMatches'),
      value: playerStats.totalMatches,
      accent: 'gray.900',
      bg: 'white',
      border: 'gray.200',
      icon: ListChecks,
      iconBg: 'gray.100',
    },
    {
      label: t('stats.winRate'),
      value: hasResultStats ? `${playerStats.winRate}%` : '-',
      accent: hasResultStats ? 'green.700' : 'gray.500',
      bg: hasResultStats ? 'green.50' : 'white',
      border: hasResultStats ? 'green.100' : 'gray.200',
      icon: Percent,
      iconBg: hasResultStats ? 'green.100' : 'gray.100',
    },
    {
      label: t('stats.wins'),
      value: hasResultStats ? playerStats.wins : '-',
      accent: hasResultStats ? 'green.700' : 'gray.500',
      bg: 'green.50',
      border: 'green.100',
      icon: Trophy,
      iconBg: 'green.100',
    },
    {
      label: t('stats.losses'),
      value: hasResultStats ? playerStats.losses : '-',
      accent: hasResultStats ? 'red.600' : 'gray.500',
      bg: 'red.50',
      border: 'red.100',
      icon: XCircle,
      iconBg: 'red.100',
    },
  ];

  return (
    <Box
      w="540px"
      minH="675px"
      bg="#f8fafc"
      color="gray.900"
      p={5}
      border="1px solid"
      borderColor="gray.100"
    >
      <VStack align="stretch" gap={4} minH="635px">
        <Flex
          position="relative"
          overflow="hidden"
          borderRadius="2xl"
          bg="linear-gradient(135deg, #065f46 0%, #15803d 68%, #f59e0b 128%)"
          color="white"
          px={6}
          py={6}
          direction="column"
          gap={4}
          minH="190px"
          boxShadow="0 18px 36px rgba(21, 128, 61, 0.22)"
        >
          <Box
            as={Feather}
            position="absolute"
            right="-12px"
            bottom="-20px"
            boxSize="150px"
            color="whiteAlpha.200"
            transform="rotate(-16deg)"
          />

          <Flex align="center" justify="space-between" gap={3} zIndex={1}>
            <Flex
              align="center"
              gap={2}
              bg="whiteAlpha.200"
              border="1px solid"
              borderColor="whiteAlpha.300"
              borderRadius="full"
              px={3}
              py={1.5}
            >
              <Box as={Award} boxSize={3.5} />
              <Text
                fontSize="10px"
                fontWeight="black"
                textTransform="uppercase"
              >
                {t('stats.achievementImageTitle')}
              </Text>
            </Flex>

            <Flex
              w="56px"
              h="56px"
              borderRadius="full"
              bg="white"
              color="green.700"
              border="3px solid"
              borderColor="whiteAlpha.500"
              align="center"
              justify="center"
              flexShrink={0}
              boxShadow="0 12px 26px rgba(0, 0, 0, 0.16)"
            >
              <Text fontSize="lg" fontWeight="black" lineHeight="1">
                {initials || playerName[0]?.toUpperCase() || 'V'}
              </Text>
            </Flex>
          </Flex>

          <Box minW={0} zIndex={1}>
            <Text
              fontSize={
                playerName.length > 22
                  ? '3xl'
                  : playerName.length > 14
                    ? '4xl'
                    : '5xl'
              }
              fontWeight="black"
              lineHeight="1.25"
              lineClamp={2}
              overflowWrap="break-word"
              pb={1}
            >
              {playerName}
            </Text>
            <Text
              mt={1}
              fontSize="lg"
              fontWeight="semibold"
              opacity={0.92}
              lineClamp={1}
            >
              {session.name}
            </Text>
          </Box>
        </Flex>

        <SimpleGrid columns={2} gap={4}>
          {achievementStats.map((stat) => (
            <Box
              key={stat.label}
              bg={stat.bg}
              borderRadius="xl"
              p={4}
              border="1px solid"
              borderColor={stat.border}
              minH="104px"
              boxShadow="0 8px 18px rgba(15, 23, 42, 0.05)"
            >
              <Flex align="flex-start" justify="space-between" gap={3} h="full">
                <Box minW={0}>
                  <Text fontSize="sm" color="gray.600" fontWeight="bold">
                    {stat.label}
                  </Text>
                  <Text
                    mt={2}
                    fontSize="4xl"
                    fontWeight="black"
                    color={stat.accent}
                    lineHeight="1"
                    fontVariantNumeric="tabular-nums"
                  >
                    {stat.value}
                  </Text>
                </Box>
                <Flex
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  bg={stat.iconBg}
                  color={stat.accent}
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Box as={stat.icon} boxSize={5} />
                </Flex>
              </Flex>
            </Box>
          ))}
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

        {!hasResultStats && (
          <Flex
            align="center"
            justify="center"
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="full"
            px={3}
            py={3}
          >
            <Text
              fontSize="sm"
              color="gray.600"
              fontWeight="bold"
              textAlign="center"
            >
              {t('stats.resultPending')}
            </Text>
          </Flex>
        )}

        <Flex
          mt="auto"
          align="center"
          justify="space-between"
          gap={4}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="xl"
          px={4}
          py={2.5}
        >
          <VStack align="stretch" gap={1.5} flex={1} minW={0}>
            {venueName && (
              <Flex align="center" gap={2} color="gray.600">
                <Box as={MapPin} boxSize={4} flexShrink={0} />
                <Text fontSize="md" fontWeight="semibold" lineClamp={1}>
                  {venueName}
                </Text>
              </Flex>
            )}
            {(sessionDate || sessionTime) && (
              <Flex align="center" gap={2} color="gray.600">
                <Box as={Calendar} boxSize={4} flexShrink={0} />
                <Text fontSize="md" fontWeight="medium" lineClamp={1}>
                  {[sessionDate, sessionTime].filter(Boolean).join(' - ')}
                </Text>
              </Flex>
            )}
          </VStack>

          {qrDataUrl && (
            <Box
              bg="white"
              p="4px"
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.200"
              flexShrink={0}
            >
              <Image src={qrDataUrl} alt="QR" boxSize="56px" />
            </Box>
          )}
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
  const [playerDoublesStats, setPlayerDoublesStats] =
    useState<PlayerDoublesMatchStats>(EMPTY_DOUBLES_MATCH_STATS);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLevelDescriptionsOpen, setIsLevelDescriptionsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compactUntilMaxPlayers);
  const { downloadSessionImage, isDownloading } = useDownloadSessionImage();

  const showExtendedInfo = !compactUntilMaxPlayers || isExpanded;
  const canSeeSessionFee = true;
  // Always show the session's actual walk-in (vãng lai) fee — never hide it
  // behind a "Contact host" placeholder.
  const feeDisplayText = FeeService.getSessionFeeForCard(session);

  const playerAchievementExportId =
    player && playerStats
      ? `player-achievement-export-${session.id}-${player.id}`
      : '';

  useEffect(() => {
    const fetchStats = async () => {
      const targetSessionId = session.id;
      if (!targetSessionId || !player?.id) {
        setPlayerStats(null);
        setPlayerDoublesStats(EMPTY_DOUBLES_MATCH_STATS);
        return;
      }

      try {
        setIsLoadingStats(true);
        const [response, matchesResult] = await Promise.all([
          SessionService.getPlayerStatistics(targetSessionId),
          SessionService.getSessionMatchesWithFilters(targetSessionId, {
            playerId: player.id,
          }),
        ]);
        const myStats = response.playerStats.find(
          (s) => s.playerId === player.id
        );
        setPlayerDoublesStats(
          getPlayerDoublesMatchStats(matchesResult.matches)
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

  const visibleDoublesStats = useMemo(
    () =>
      [
        {
          key: 'menDoubles',
          label: t('stats.menDoubles'),
          value: playerDoublesStats.menDoubles,
          color: 'blue.500',
        },
        {
          key: 'womenDoubles',
          label: t('stats.womenDoubles'),
          value: playerDoublesStats.womenDoubles,
          color: 'pink.500',
        },
        {
          key: 'mixedDoubles',
          label: t('stats.mixedDoubles'),
          value: playerDoublesStats.mixedDoubles,
          color: 'purple.500',
        },
      ].filter((stat) => stat.value > 0),
    [playerDoublesStats, t]
  );

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
          variant={session.status === 'IN_PROGRESS' ? 'solid' : 'subtle'}
          px={3.5}
          py={1}
          borderRadius="full"
          fontSize="sm"
          fontWeight="semibold"
          lineHeight="1.2"
          bg={session.status === 'IN_PROGRESS' ? 'green.100' : undefined}
          color={session.status === 'IN_PROGRESS' ? 'green.700' : undefined}
          borderWidth="1px"
          borderColor={
            session.status === 'IN_PROGRESS' ? 'green.200' : 'transparent'
          }
          boxShadow={
            session.status === 'IN_PROGRESS'
              ? '0 2px 8px rgba(22, 163, 74, 0.12)'
              : undefined
          }
        >
          {session.status === 'PREPARING'
            ? t('notStarted')
            : session.status === 'IN_PROGRESS'
              ? t('inProgress')
              : t('finished')}
        </Badge>
      </InfoRow>

      <InfoRow icon={Map} label={t('venue')}>
        {getSessionLocationName(session) || t('common.notAvailable')}
      </InfoRow>

      <InfoRow icon={MapPin} label={t('location')} hideLabelOnMobile>
        <AppAddressDisplay
          address={
            getSessionLocationAddress(session) ||
            (session.customLocationName && !session.customLocationAddress
              ? t('noAddress')
              : t('noLocation'))
          }
          district={
            session.venue?.district ||
            session.customLocationDistrict ||
            undefined
          }
          city={session.venue?.city || session.customLocationCity || undefined}
          newAddress={session.venue?.newAddress}
          newDistrict={session.venue?.newDistrict}
          fontSize="md"
          color="inherit"
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
        {session.startTime
          ? formatTimeRangeByDevicePreference(
              session.startTime,
              session.endTime
            )
          : '--:--'}
      </InfoRow>

      <InfoRow icon={Users} label={t('maxPlayersTitle') || 'Tối đa'}>
        {session.numberOfCourts * (session.maxPlayersPerCourt || 4)} (
        {t('playersTab.players') || 'Người chơi'})
      </InfoRow>

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
                sortLevelsByRank(
                  Array.from(new Set(session.requiredLevels))
                ).map((level: number) => {
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
                  {feeDisplayText}
                </Text>
                {canSeeSessionFee &&
                  FeeService.shouldShowPerSlot(session.feeConfig) && (
                    <Text ml={1} color="gray.500" fontSize="sm">
                      /slot
                    </Text>
                  )}
                {canSeeSessionFee && (
                  <FeeDetailPopover feeConfig={session.feeConfig} />
                )}
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

      {compactUntilMaxPlayers && (
        <Button
          type="button"
          size="xs"
          variant="ghost"
          colorPalette="green"
          alignSelf="center"
          mt={-1}
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
              {[
                {
                  label: t('stats.wins'),
                  value: playerStats.wins,
                  color: 'green.500',
                },
                {
                  label: t('stats.losses'),
                  value: playerStats.losses,
                  color: 'red.500',
                },
                {
                  label: t('stats.winRate'),
                  value: `${playerStats.winRate}%`,
                  color: playerStats.winRate >= 50 ? 'green.500' : 'orange.500',
                },
                {
                  label: t('stats.totalMatches'),
                  value: playerStats.totalMatches,
                },
                ...visibleDoublesStats,
              ].map((stat) => (
                <Box
                  key={stat.label}
                  p={2}
                  bg="gray.50"
                  _dark={{ bg: 'gray.700' }}
                  borderRadius="md"
                  textAlign="center"
                >
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    {stat.label}
                  </Text>
                  <Text fontWeight="bold" color={stat.color}>
                    {stat.value}
                  </Text>
                </Box>
              ))}
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
