'use client';

import { ISession, UserRatingStats } from '@/lib/api/types';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import dayjs from '@/lib/dayjs';
import {
  Badge,
  Box,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
  Wrap,
} from '@chakra-ui/react';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import {
  Calendar,
  Clock,
  DollarSign,
  Shield,
  SquareAsterisk,
  User,
  Users,
} from 'lucide-react';
import { FeeService } from '@/lib/api/fee.service';
import { FeeType } from '@/lib/api/types';
import { useLocale, useTranslations } from 'next-intl';
import { Locale } from '@/i18n/locales';
import FeeDetailPopover from '@/components/fee/FeeDetailPopover';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { StarRatingDisplay } from '@/components/rating';
import { RatingService } from '@/lib/api/rating.service';
import { useState, useEffect } from 'react';

// Helper functions for formatting with locale support
export const formatDate = (
  dateString: string | Date,
  locale: string
): string => {
  const date = dayjs(dateString).locale(locale === Locale.VI ? Locale.VI : Locale.EN);

  let formattedDate: string;

  if (locale === Locale.VI) {
    formattedDate = date.format('dddd, DD MMMM, YYYY');
  } else {
    formattedDate = date.format('ddd, MMM DD, YYYY');
  }

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

export const formatTime = (
  dateString: string | Date,
  locale: string
): string => {
  const date = dayjs(dateString).locale(locale === Locale.VI ? Locale.VI : Locale.EN);
  return date.format('HH:mm');
};

export const statusColors: Record<string, string> = {
  PREPARING: 'blue',
  IN_PROGRESS: 'green',
  FINISHED: 'gray',
};

export const getStatusLabel = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'PREPARING':
      return t('status.preparing');
    case 'IN_PROGRESS':
      return t('status.inProgress');
    case 'FINISHED':
      return t('status.finished');
    default:
      return status;
  }
};

interface BaseSessionCardProps {
  session: ISession;

  // Customization slots
  statusBadgeContent?: React.ReactNode;
  afterStatusContent?: React.ReactNode; // For registration warnings
  extraInfoRows?: React.ReactNode; // For location/venue display
  actionButtons: React.ReactNode; // Required: join/view/delete buttons

  // New props
  sessionDistance?: number;

  // Optional modal
  modalContent?: React.ReactNode;
}

const BaseSessionCard = ({
  session,
  statusBadgeContent,
  afterStatusContent,
  extraInfoRows,
  actionButtons,
  modalContent,
  hostActions, // New prop
  sessionDistance,
}: BaseSessionCardProps & { hostActions?: React.ReactNode }) => {
  const t = useTranslations('session');
  const { getLevelShortLabel } = useLevelLabel();
  const locale = useLocale();

  // Host rating state
  const [hostRatingStats, setHostRatingStats] = useState<UserRatingStats | null>(null);

  // Fetch host rating stats
  useEffect(() => {
    const fetchHostRating = async () => {
      if (!session.hostId) return;
      try {
        const stats = await RatingService.getUserRatingStats(session.hostId);
        setHostRatingStats(stats);
      } catch (error) {
        // Silently fail - rating is optional display
      }
    };
    fetchHostRating();
  }, [session.hostId]);

  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;

  // Use session.hostName if available, fallback to host.name
  const displayHostName = session.hostName || session.host?.name || '';

  const convertedSession = {
    id: session.id,
    title: session.name,
    date: session.startTime
      ? formatDate(session.startTime, locale)
      : formatDate(session.createdAt, locale) + ` (${t('notStarted')})`,
    time: session.startTime
      ? `${formatTime(session.startTime, locale)} - ${
          session.endTime
            ? formatTime(session.endTime, locale)
            : t('inProgress')
        }`
      : t('notStartedYet'),
    numberOfCourts: session.numberOfCourts,
    totalPlayers: session._count?.players || 0,
    maxPlayers,
    status: session.status,
    hostName: displayHostName,
  };

  // Get skill level color for left border
  const skillLevelColor = getSkillLevelColor(session.requiredLevels);

  return (
    <>
      <Flex
        direction="column"
        h="100%"
        gap={4}
        borderWidth="1px"
        borderLeftWidth="4px"
        borderLeftColor={skillLevelColor.borderColor}
        borderRadius="lg"
        overflow="hidden"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        p={6}
        transition="transform 0.2s, box-shadow 0.2s"
        _hover={{
          transform: 'translateY(-4px)',
          boxShadow: 'lg',
        }}
      >
        <Flex justify="space-between" align="flex-start">
          <Heading size="md" mb={2}>
            {convertedSession.title}
          </Heading>
          {statusBadgeContent || (
            <Badge
              colorPalette={statusColors[convertedSession.status] || 'gray'}
            >
              {getStatusLabel(convertedSession.status, t)}
            </Badge>
          )}
        </Flex>

        {afterStatusContent}

        <Stack gap={3} flex={1}>
          <Flex align="center" flexWrap="wrap" gap={2}>
            <Flex align="center">
              <Icon as={User} boxSize={5} mr={2} color="blue.500" />
              <Text>
                {t('host')}: <strong>{convertedSession.hostName}</strong>
              </Text>
            </Flex>
            {hostRatingStats && hostRatingStats.totalRatings > 0 && (
              <StarRatingDisplay
                rating={hostRatingStats.averageRating}
                count={hostRatingStats.totalRatings}
                size="xs"
                variant="compact"
              />
            )}
            {hostActions && <Box ml={2}>{hostActions}</Box>}
          </Flex>

          {extraInfoRows}

          <Flex align="center">
            <Icon as={Calendar} boxSize={5} mr={2} color="blue.500" />
            <Text>{convertedSession.date}</Text>
          </Flex>
          <Flex align="center">
            <Icon as={Clock} boxSize={5} mr={2} color="blue.500" />
            <Text>{convertedSession.time}</Text>
          </Flex>
          <Flex align="center">
            <Icon as={SquareAsterisk} boxSize={5} mr={2} color="blue.500" />
            <Text>
              {convertedSession.numberOfCourts} {t('courtsAvailable')}
            </Text>
          </Flex>
          <Flex align="center">
            <Icon as={Users} boxSize={5} mr={2} color="blue.500" />
            <Text>
              {convertedSession.totalPlayers} / {convertedSession.maxPlayers}{' '}
              {t('players')}
            </Text>
          </Flex>
          <Flex align="center">
            <Icon as={Shield} boxSize={5} mr={2} color={skillLevelColor.color} />
            <Wrap gap={1}>
              {session.requiredLevels && session.requiredLevels.length > 0 ? (
                Array.from(new Set(session.requiredLevels)).map((level) => {
                  const levelColor = getSkillLevelColor([level]);
                  return (
                    <Badge
                      key={level}
                      colorPalette={levelColor.colorPalette}
                      fontSize="sm"
                      variant="solid"
                      px={2}
                      py={0.5}
                      borderRadius="md"
                    >
                      {getLevelShortLabel(level)}
                    </Badge>
                  );
                })
              ) : (
                <Badge
                  colorPalette={skillLevelColor.colorPalette}
                  fontSize="sm"
                  variant="solid"
                  px={2}
                  py={0.5}
                  borderRadius="md"
                >
                  {t('allLevels')}
                </Badge>
              )}
            </Wrap>
          </Flex>


          {/* Fee Display */}
          {session.feeConfig && (
            <Flex align="center">
              <Icon as={DollarSign} boxSize={5} mr={2} color="blue.500" />
              <Text>
                <Text as="span" fontWeight="bold" color="green.600">
                  {FeeService.getFeeDisplayText(session.feeConfig)}
                </Text>
                {session.feeConfig.feeType === FeeType.FIXED && (
                  <Text as="span" fontSize="sm" color="gray.500" ml={1}>
                    /slot
                  </Text>
                )}
              </Text>
              <FeeDetailPopover feeConfig={session.feeConfig} />
            </Flex>
          )}

          {session.description && (
            <Text
              fontSize="sm"
              color="gray.600"
              _dark={{ color: 'gray.300' }}
              overflow="hidden"
              display="-webkit-box"
              style={{
                WebkitLineClamp: '2',
                WebkitBoxOrient: 'vertical',
              }}
            >
              {session.description}
            </Text>
          )}
        </Stack>

        <Flex mt={4} gap={2} justify="flex-end">
          {actionButtons}
        </Flex>
      </Flex>

      {modalContent}
    </>
  );
};

export default BaseSessionCard;
