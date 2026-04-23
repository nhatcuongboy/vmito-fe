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
import { VStack } from '@/components/ui/chakra-compat';
import {
  Award,
  Calendar,
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

interface InfoRowProps extends FlexProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  isTruncated?: boolean;
}

const InfoRow = ({
  icon,
  label,
  children,
  isTruncated,
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
}

export default function SessionInfo({ session, player }: SessionInfoProps) {
  const t = useTranslations('SessionDetail');
  const locale = useLocale();
  const { getLevelShortLabel } = useLevelLabel();
  const [playerStats, setPlayerStats] = useState<PlayerStatistics | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const targetSessionId = session.id;
      if (!targetSessionId || !player?.id) return;

      try {
        setIsLoadingStats(true);
        const response =
          await SessionService.getPlayerStatistics(targetSessionId);
        const myStats = response.playerStats.find(
          (s) => s.playerId === player.id
        );
        if (myStats) {
          setPlayerStats(myStats);
        }
      } catch (error) {
        console.error('Failed to fetch player stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [session.id, player?.id]);

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

      <InfoRow icon={MapPin} label={t('location')}>
        <AppAddressDisplay
          address={
            session.venue?.address || session.location || t('noLocation')
          }
          newAddress={session.venue?.newAddress}
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

      <InfoRow icon={Square} label={t('numberOfCourtsTitle')}>
        {session.numberOfCourts}
      </InfoRow>

      {session.shuttlecock && (
        <InfoRow icon={Feather} label={t('shuttlecock')}>
          {session.shuttlecock}
        </InfoRow>
      )}

      <InfoRow icon={Award} label={t('requiredLevels')}>
        <Flex gap={2} flexWrap="wrap">
          {session.requiredLevels && session.requiredLevels.length > 0 ? (
            Array.from(new Set(session.requiredLevels))
              .sort((a, b) => a - b)
              .map((level: number) => {
                const levelColor = getSkillLevelColor([level]);
                return (
                  <Badge
                    key={level}
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
                  </Badge>
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

      {/* Player Statistics Section */}
      {player && player.status !== 'INACTIVE' && (
        <Box
          mt={4}
          pt={4}
          borderTopWidth="1px"
          borderColor="gray.100"
          _dark={{ borderColor: 'gray.700' }}
        >
          <Flex align="center" mb={3}>
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
        </Box>
      )}
    </VStack>
  );
}
