'use client';

import {
  Box,
  Stack,
  Badge,
  Icon,
  Flex,
  Text,
  Heading,
  Wrap
} from '@chakra-ui/react';
import { Calendar, Clock, Users, SquareAsterisk, Eye, Shield } from 'lucide-react';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { useTranslations, useLocale } from 'next-intl';
import dayjs from '@/lib/dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import { ISession } from '@/lib/api/types';

// Helper functions for formatting with locale support
const formatDate = (dateString: string | Date, locale: string): string => {
  const date = dayjs(dateString).locale(locale === 'vi' ? 'vi' : 'en');

  let formattedDate: string;

  if (locale === 'vi') {
    // Vietnamese format: "Thứ 2, 04 tháng 7, 2025"
    formattedDate = date.format('dddd, DD MMMM, YYYY');
  } else {
    // English format: "Mon, Jul 04, 2025"
    formattedDate = date.format('ddd, MMM DD, YYYY');
  }

  // Capitalize the first letter of the day name
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

const formatTime = (dateString: string | Date, locale: string): string => {
  const date = dayjs(dateString).locale(locale === 'vi' ? 'vi' : 'en');
  return date.format('HH:mm');
};

interface PlayerSessionData {
  id: string;
  name: string;
  status: 'PREPARING' | 'IN_PROGRESS' | 'FINISHED';
  startTime: string | null;
  endTime: string | null;
  numberOfCourts: number;
  maxPlayersPerCourt: number;
  createdAt: string;
  host: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    players: number;
  };
  playerData: {
    id: string;
    playerNumber: number;
    name: string;
    gender: string | null;
    level: string | null;
    status: string;
    joinedAt: string | null;
    matchesPlayed: number;
    totalWaitTime: number;
  };
}

interface PlayerSessionCardProps {
  session: ISession;
}

const statusColors = {
  PREPARING: 'blue',
  IN_PROGRESS: 'green',
  FINISHED: 'gray',
};

// Helper function to get localized status labels
const getStatusLabel = (status: string, t: any) => {
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

export default function PlayerSessionCard({ session }: PlayerSessionCardProps) {
  const t = useTranslations('session');
  const locale = useLocale();

  // Calculate max players and format date/time
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const displayDate = session.startTime
    ? formatDate(session.startTime, locale)
    : formatDate(session.createdAt, locale) + ` (${t('notStarted')})`;

  const displayTime = session.startTime
    ? `${formatTime(session.startTime, locale)} - ${
        session.endTime ? formatTime(session.endTime, locale) : t('inProgress')
      }`
    : t('notStartedYet');

  return (
    <Box
      borderWidth="1px"
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
      <Stack gap={4}>
        <Flex justify="space-between" align="flex-start">
          <Heading size="md" mb={2}>
            {session.name}
          </Heading>
          <Badge colorScheme={statusColors[session.status]}>
            {getStatusLabel(session.status, t)}
          </Badge>
        </Flex>

        <Stack gap={3}>
          <Flex align="center">
            <Icon as={Calendar} boxSize={5} mr={2} color="blue.500" />
            <Text>{displayDate}</Text>
          </Flex>
          <Flex align="center">
            <Icon as={Clock} boxSize={5} mr={2} color="blue.500" />
            <Text>{displayTime}</Text>
          </Flex>
          <Flex align="center">
            <Icon as={SquareAsterisk} boxSize={5} mr={2} color="blue.500" />
            <Text>
              {session.numberOfCourts} {t('courtsAvailable')}
            </Text>
          </Flex>
          <Flex align="center">
            <Icon as={Users} boxSize={5} mr={2} color="blue.500" />
            {/* <Text>
              {session._count.players} / {maxPlayers} {t("players")}
            </Text> */}
          </Flex>
          {session.requiredLevels &&
            session.requiredLevels.length > 0 && (
              <Flex align="flex-start">
                <Icon as={Shield} boxSize={5} mr={2} color="blue.500" mt={0.5} />
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>
                    Required Levels:
                  </Text>
                  <Wrap gap={1}>
                    {session.requiredLevels.map((level) => (
                      <Badge key={level} colorScheme="blue" fontSize="xs">
                        {level.replace('_', ' ')}
                      </Badge>
                    ))}
                  </Wrap>
                </Box>
              </Flex>
            )}

          {/* Player-specific info */}
          <Box
            mt={2}
            p={3}
            bg="blue.50"
            borderRadius="md"
            _dark={{ bg: 'blue.900' }}
          >
            <Text
              fontSize="sm"
              fontWeight="medium"
              color="blue.700"
              _dark={{ color: 'blue.200' }}
            >
              {t('yourStats')}:
            </Text>
            <Flex gap={4} mt={1}>
              <Text fontSize="sm">
                {/* {t("matches")}: {session.playerData.matchesPlayed} */}
              </Text>
              <Text fontSize="sm">
                {t('waitTime')}:{' '}
                {/* {Math.round(session.playerData.totalWaitTime / 60)}m */}
              </Text>
              <Text fontSize="sm">
                {/* {t("playerNumber")}: #{session.playerData.playerNumber} */}
              </Text>
            </Flex>
          </Box>
        </Stack>

        <Flex mt={4} gap={2} justify="flex-end">
          <NextLinkButton href={`/my-session`} colorScheme="green" size="md">
            <Eye className="mr-2 h-4 w-4" /> {t('viewSession')}
          </NextLinkButton>
        </Flex>
      </Stack>
    </Box>
  );
}
