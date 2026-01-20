'use client';

import { ISession } from '@/lib/api/types';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import dayjs from '@/lib/dayjs';
import {
  Badge,
  Box,
  Button,
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
  Shield,
  SquareAsterisk,
  User,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { NextLinkButton } from '@/components/ui/NextLinkButton';

// Helper functions for formatting with locale support
const formatDate = (dateString: string | Date, locale: string): string => {
  const date = dayjs(dateString).locale(locale === 'vi' ? 'vi' : 'en');
  let formattedDate: string;
  if (locale === 'vi') {
    formattedDate = date.format('dddd, DD MMMM, YYYY');
  } else {
    formattedDate = date.format('ddd, MMM DD, YYYY');
  }
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

const formatTime = (dateString: string | Date, locale: string): string => {
  const date = dayjs(dateString).locale(locale === 'vi' ? 'vi' : 'en');
  return date.format('HH:mm');
};

const statusColors = {
  PREPARING: 'blue',
  IN_PROGRESS: 'green',
  FINISHED: 'gray',
} as const;

// Helper function to get localized status labels
const getStatusLabel = (status: string, t: (key: string) => string) => {
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

interface FindSessionCardProps {
  session: ISession;
  onJoin: () => void;
  isJoined?: boolean;
}

const FindSessionCard = ({
  session,
  onJoin,
  isJoined = false,
}: FindSessionCardProps) => {
  const t = useTranslations('session');
  // const tCommon = useTranslations('common');
  const { getLevelShortLabel } = useLevelLabel();
  const locale = useLocale();
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;

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
    status: session.status as keyof typeof statusColors,
    hostName: session.host?.name || '',
  };

  return (
    <Flex
      direction="column"
      h="100%"
      gap={4}
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
      <Flex justify="space-between" align="flex-start">
        <Heading size="md" mb={2}>
          {convertedSession.title}
        </Heading>
        <Badge colorScheme={statusColors[convertedSession.status] || 'gray'}>
          {getStatusLabel(convertedSession.status, t)}
        </Badge>
      </Flex>

      <Stack gap={3} flex={1}>
        <Flex align="center">
          <Icon as={User} boxSize={5} mr={2} color="blue.500" />
          <Text>
            {t('host')}: <strong>{convertedSession.hostName}</strong>
          </Text>
        </Flex>
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
        {session.requiredLevels && session.requiredLevels.length > 0 && (
          <Flex align="flex-start">
            <Icon as={Shield} boxSize={5} mr={2} color="blue.500" mt={0.5} />
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={1}>
                {t('requiredLevels')}:
              </Text>
              <Wrap gap={1}>
                {session.requiredLevels.map((level) => (
                  <Badge key={level} colorScheme="blue" fontSize="xs">
                    {getLevelShortLabel(level)}
                  </Badge>
                ))}
              </Wrap>
            </Box>
          </Flex>
        )}
      </Stack>

      <Flex mt={4} gap={2} justify="flex-end">
        {isJoined ? (
          <NextLinkButton
            href={`/player/sessions/${session.id}`}
            colorScheme="green"
            width="full"
          >
            {t('viewSession')}
          </NextLinkButton>
        ) : (
          <Button colorScheme="blue" onClick={onJoin} width="full">
            {t('joinSession')}
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export default FindSessionCard;
